import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { FillFieldResult, SiteAdapter } from "../../apps/server/src/adapters/site-adapter.js";
import type { BrowserService } from "../../apps/server/src/browser/playwright.js";
import { applyMigrations } from "../../apps/server/src/db/migrations.js";
import { appMigrations } from "../../apps/server/src/db/migrations/index.js";
import {
  openSqliteDatabase,
  type SqliteDatabase
} from "../../apps/server/src/db/sqlite.js";
import { createMemoryRepository } from "../../apps/server/src/memory/memory-repository.js";
import { createProfileRepository } from "../../apps/server/src/profile/profile-repository.js";
import type { FieldDescriptor, ResolverDecision } from "../../apps/server/src/resolvers/index.js";
import { createPromptBridge } from "../../apps/server/src/runner/prompt-bridge.js";
import { createRunManager } from "../../apps/server/src/runner/run-manager.js";
import { createRunRepository } from "../../apps/server/src/runner/run-repository.js";
import { createRunEventPublisher } from "../../apps/server/src/runner/step-publisher.js";
import type { ApplicantProfile, RunEvent } from "../../packages/shared/src/index.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const temporaryDirectory of temporaryDirectories.splice(0)) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

describe("run manager", () => {
  it("creates a prompt for an unknown field and does not fill before a response", async () => {
    const harness = createHarness({
      fields: [unknownTextField()]
    });
    const events: RunEvent[] = [];
    harness.eventPublisher.subscribe((event) => events.push(event));

    const response = await harness.runManager.startRun(
      "https://jobs.example.com/apply"
    );

    expect(response.run).toMatchObject({
      id: "run-1",
      status: "prompting",
      currentPromptId: "prompt-1"
    });
    expect(harness.adapter.fillDecisions).toEqual([]);
    expect(harness.runRepository.getCurrentPrompt("run-1")).toMatchObject({
      id: "prompt-1",
      fieldLabel: "Favorite database",
      status: "open"
    });
    expect(events.map((event) => event.eventType)).toContain("promptCreated");

    harness.database.close();
  });

  it("resumes after a prompt response and fills only the answered field safely", async () => {
    const harness = createHarness({
      fields: [unknownTextField()]
    });
    await harness.runManager.startRun("https://jobs.example.com/apply");

    const response = await harness.runManager.respondToPrompt({
      runId: "run-1",
      promptId: "prompt-1",
      response: {
        action: "answer",
        answerType: "text",
        value: "PostgreSQL",
        saveForReuse: false
      }
    });

    expect(response).toMatchObject({
      run: {
        id: "run-1",
        status: "waitingForReview"
      },
      prompt: {
        id: "prompt-1",
        status: "answered"
      }
    });
    expect(harness.adapter.fillDecisions).toHaveLength(1);
    expect(harness.adapter.fillDecisions[0]).toMatchObject({
      action: "fill",
      source: "prompt-response",
      field: {
        label: "Favorite database"
      },
      answer: {
        answerType: "text",
        value: "PostgreSQL"
      }
    });

    harness.database.close();
  });

  it("saves prompt answers for reuse only when the user opts in", async () => {
    const saveHarness = createHarness({
      fields: [unknownTextField()]
    });
    await saveHarness.runManager.startRun("https://jobs.example.com/apply");
    await saveHarness.runManager.respondToPrompt({
      runId: "run-1",
      promptId: "prompt-1",
      response: {
        action: "answer",
        answerType: "text",
        value: "PostgreSQL",
        saveForReuse: true
      }
    });

    expect(saveHarness.memoryRepository.listLearnedAnswers()).toMatchObject([
      {
        rawLabel: "Favorite database",
        normalizedLabel: "favorite database",
        answerType: "text",
        value: "PostgreSQL",
        state: "enabled"
      }
    ]);
    saveHarness.database.close();

    const noSaveHarness = createHarness({
      fields: [unknownTextField()]
    });
    await noSaveHarness.runManager.startRun("https://jobs.example.com/apply");
    await noSaveHarness.runManager.respondToPrompt({
      runId: "run-1",
      promptId: "prompt-1",
      response: {
        action: "answer",
        answerType: "text",
        value: "MySQL",
        saveForReuse: false
      }
    });

    expect(noSaveHarness.memoryRepository.listLearnedAnswers()).toEqual([]);
    noSaveHarness.database.close();
  });

  it("reuses learned answers on later runs and updates last-used timestamps", async () => {
    const harness = createHarness({
      fields: [unknownTextField()],
      ids: [
        "memory-1",
        "run-1",
        "step-1",
        "step-2",
        "step-3",
        "step-4",
        "step-5",
        "step-6"
      ]
    });
    harness.memoryRepository.createLearnedAnswer({
      rawLabel: "Favorite database",
      normalizedLabel: "favorite database",
      controlType: "text",
      pageHost: "jobs.example.com",
      pagePathPattern: "/apply",
      nearbyContext: "Application questions favorite database",
      answer: {
        answerType: "text",
        value: "PostgreSQL"
      }
    });

    const response = await harness.runManager.startRun(
      "https://jobs.example.com/apply"
    );
    const [memory] = harness.memoryRepository.listLearnedAnswers();

    expect(response.run.status).toBe("waitingForReview");
    expect(harness.adapter.fillDecisions).toHaveLength(1);
    expect(harness.adapter.fillDecisions[0]).toMatchObject({
      source: "learned-answer",
      learnedAnswerId: "memory-1"
    });
    expect(memory?.lastUsedAt).toBeDefined();

    harness.database.close();
  });

  it("publishes understandable event ordering across start, scan, fill, prompt, resume, and review", async () => {
    const harness = createHarness({
      profile,
      fields: [emailField(), unknownTextField()]
    });
    const events: RunEvent[] = [];
    harness.eventPublisher.subscribe((event) => events.push(event));

    await harness.runManager.startRun("https://jobs.example.com/apply");
    const promptId = harness.runRepository.getRun("run-1")?.currentPromptId;
    expect(promptId).toBeDefined();
    await harness.runManager.respondToPrompt({
      runId: "run-1",
      promptId: promptId ?? "",
      response: {
        action: "answer",
        answerType: "text",
        value: "PostgreSQL",
        saveForReuse: false
      }
    });

    expect(events.map((event) => event.eventType)).toEqual(
      expect.arrayContaining([
        "runStatusChanged",
        "runStepAdded",
        "promptCreated",
        "promptAnswered"
      ])
    );
    expect(
      events
        .filter((event) => event.eventType === "runStatusChanged")
        .map((event) => event.status)
    ).toEqual([
      "pending",
      "starting",
      "scanning",
      "filling",
      "prompting",
      "filling",
      "waitingForReview"
    ]);

    harness.database.close();
  });

  it("records observable failed and canceled terminal states", async () => {
    const failedHarness = createHarness({
      profile,
      fields: [emailField()],
      failFill: true
    });
    await failedHarness.runManager.startRun("https://jobs.example.com/apply");

    expect(failedHarness.runRepository.getRun("run-1")).toMatchObject({
      status: "failed",
      failedAt: expect.any(String)
    });
    failedHarness.database.close();

    const canceledHarness = createHarness({
      fields: [unknownTextField()]
    });
    await canceledHarness.runManager.startRun("https://jobs.example.com/apply");
    const canceledRun = canceledHarness.runManager.cancelRun("run-1");

    expect(canceledRun).toMatchObject({
      status: "canceled",
      canceledAt: expect.any(String)
    });
    canceledHarness.database.close();
  });
});

function createHarness(options: {
  readonly fields: readonly FieldDescriptor[];
  readonly profile?: ApplicantProfile;
  readonly ids?: string[];
  readonly failFill?: boolean;
}) {
  const database = openMigratedTemporaryDatabase();
  const ids = options.ids ?? [
    "run-1",
    "step-1",
    "step-2",
    "step-3",
    "step-4",
    "step-5",
    "prompt-1",
    "step-6",
    "memory-1",
    "step-7"
  ];
  const repositoryOptions = {
    now: createClock(),
    createId: createIds(ids)
  };
  const profileRepository = createProfileRepository(database, createClock());
  const memoryRepository = createMemoryRepository(database, repositoryOptions);
  const runRepository = createRunRepository(database, repositoryOptions);
  const eventPublisher = createRunEventPublisher();
  const promptBridge = createPromptBridge({
    runRepository,
    memoryRepository,
    eventPublisher,
    now: createClock()
  });
  const adapter = createFakeAdapter(options.fields, options.failFill ?? false);
  const runManager = createRunManager({
    browserService: createFakeBrowserService(),
    siteAdapter: adapter,
    profileRepository,
    memoryRepository,
    runRepository,
    eventPublisher,
    promptBridge,
    now: createClock()
  });

  if (options.profile) {
    profileRepository.updateProfile(options.profile);
  }

  return {
    database,
    adapter,
    eventPublisher,
    memoryRepository,
    runRepository,
    runManager
  };
}

function openMigratedTemporaryDatabase(): SqliteDatabase {
  const temporaryDirectory = mkdtempSync(
    path.join(os.tmpdir(), "fast-app-run-manager-")
  );
  temporaryDirectories.push(temporaryDirectory);

  const database = openSqliteDatabase({
    databasePath: path.join(temporaryDirectory, "app.db")
  });
  applyMigrations(database, appMigrations);

  return database;
}

function createFakeBrowserService(): BrowserService {
  return {
    browserProfilePath: "/tmp/fast-app-browser-profile",
    async openContext() {
      return {} as Awaited<ReturnType<BrowserService["openContext"]>>;
    },
    async openPage() {
      return {
        url: () => "https://jobs.example.com/apply"
      } as Awaited<ReturnType<BrowserService["openPage"]>>;
    },
    async close() {
      return undefined;
    }
  };
}

function createFakeAdapter(
  fields: readonly FieldDescriptor[],
  failFill: boolean
): SiteAdapter & { readonly fillDecisions: ResolverDecision[] } {
  const fillDecisions: ResolverDecision[] = [];

  return {
    fillDecisions,
    async scanPage() {
      return fields;
    },
    async fillField(_page, decision): Promise<FillFieldResult> {
      if (failFill) {
        throw new Error("Synthetic fill failure.");
      }

      fillDecisions.push(decision);

      return {
        action: decision.action === "fill" ? "filled" : "skipped",
        field: decision.field,
        metadata: {
          action: decision.action === "fill" ? "fill" : "skip",
          pageUrl: "https://jobs.example.com/apply",
          fieldLabel: decision.field.label,
          controlType: decision.field.controlType,
          decisionAction: decision.action,
          reason: decision.reason,
          ...(decision.action === "fill" ? { source: decision.source } : {})
        }
      };
    },
    async classifyContinuationControls() {
      return [];
    }
  };
}

function createClock(): () => string {
  let counter = 0;

  return () => {
    counter += 1;
    return new Date(Date.UTC(2026, 5, 28, 0, 0, counter)).toISOString();
  };
}

function createIds(ids: string[]): () => string {
  return () => ids.shift() ?? crypto.randomUUID();
}

function unknownTextField(): FieldDescriptor {
  return {
    label: "Favorite database",
    controlType: "text",
    pageHost: "jobs.example.com",
    pagePath: "/apply",
    nearbyContext: "Application questions favorite database"
  };
}

function emailField(): FieldDescriptor {
  return {
    label: "Email address",
    controlType: "text",
    pageHost: "jobs.example.com",
    pagePath: "/apply"
  };
}

const profile: ApplicantProfile = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  phone: "555-0100",
  location: "San Francisco, CA",
  workAuthorization: "Yes",
  sponsorshipRequired: false
};
