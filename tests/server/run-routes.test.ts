import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createServerApp } from "../../apps/server/src/app.js";
import type { SiteAdapter } from "../../apps/server/src/adapters/site-adapter.js";
import type { BrowserService } from "../../apps/server/src/browser/playwright.js";
import { loadServerRuntimePaths } from "../../apps/server/src/config/runtime-paths.js";
import type { RunEvent } from "../../packages/shared/src/index.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const temporaryDirectory of temporaryDirectories.splice(0)) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

describe("run routes", () => {
  it("starts a browser-backed run and stops for review when no prompts are needed", async () => {
    const server = await createTemporaryServer({
      ids: ["run-1", "step-1", "step-2", "step-3", "step-4", "step-5", "step-6"],
      timestamps: [
        "2026-06-28T00:00:00.000Z",
        "2026-06-28T00:01:00.000Z",
        "2026-06-28T00:02:00.000Z",
        "2026-06-28T00:03:00.000Z",
        "2026-06-28T00:04:00.000Z",
        "2026-06-28T00:05:00.000Z",
        "2026-06-28T00:06:00.000Z"
      ]
    });
    const events: RunEvent[] = [];
    server.context.eventPublisher.subscribeToRun("run-1", (event) => {
      events.push(event);
    });

    const response = await server.app.inject({
      method: "POST",
      url: "/runs",
      payload: {
        jobUrl: "  https://jobs.example.com/apply/123  "
      }
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toMatchObject({
      run: {
        id: "run-1",
        jobUrl: "https://jobs.example.com/apply/123",
        status: "waitingForReview",
        latestStep: {
          id: "step-6",
          runId: "run-1",
          status: "waitingForReview",
          level: "info",
          message:
            "Current page filled as far as safely possible. Waiting for human review."
        }
      }
    });
    expect(server.context.runRepository.listRunSteps("run-1")).toHaveLength(6);
    expect(events.map((event) => event.eventType)).toEqual([
      "runStatusChanged",
      "runStepAdded",
      "runStatusChanged",
      "runStepAdded",
      "runStatusChanged",
      "runStepAdded",
      "runStepAdded",
      "runStatusChanged",
      "runStepAdded",
      "runStatusChanged",
      "runStepAdded"
    ]);

    await server.close();
  });

  it("rejects invalid run payloads with a structured error", async () => {
    const server = await createTemporaryServer();

    const response = await server.app.inject({
      method: "POST",
      url: "/runs",
      payload: {
        jobUrl: "not-a-url"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid run payload."
      }
    });

    await server.close();
  });

  it("returns run status with step history and current prompt", async () => {
    const server = await createTemporaryServer({
      ids: ["run-1", "prompt-1", "step-1"],
      timestamps: [
        "2026-06-28T00:00:00.000Z",
        "2026-06-28T00:01:00.000Z",
        "2026-06-28T00:02:00.000Z",
        "2026-06-28T00:03:00.000Z"
      ]
    });
    const run = server.context.runRepository.createRun(
      "https://jobs.example.com/apply/123"
    );
    const prompt = server.context.runRepository.createPrompt({
      runId: run.id,
      fieldLabel: "Work authorization",
      normalizedFieldLabel: "work authorization",
      controlType: "radio",
      pageHost: "jobs.example.com",
      pagePath: "/apply/123",
      nearbyContext: "Eligibility",
      message: "Please confirm work authorization."
    });
    server.context.runRepository.setCurrentPrompt(run.id, prompt.id);
    const step = server.context.runRepository.appendRunStep({
      runId: run.id,
      status: "prompting",
      level: "warning",
      message: "Paused for user input.",
      promptId: prompt.id
    });

    const response = await server.app.inject({
      method: "GET",
      url: `/runs/${run.id}`
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      run: {
        id: run.id,
        status: "pending",
        currentPromptId: prompt.id,
        latestStep: {
          id: step.id,
          runId: run.id,
          status: "prompting",
          level: "warning",
          message: "Paused for user input.",
          promptId: prompt.id
        }
      },
      currentPrompt: {
        id: prompt.id,
        runId: run.id,
        status: "open",
        fieldLabel: "Work authorization"
      },
      steps: [
        {
          id: step.id,
          runId: run.id,
          status: "prompting",
          level: "warning",
          message: "Paused for user input.",
          promptId: prompt.id
        }
      ]
    });

    await server.close();
  });

  it("returns a structured error for missing runs", async () => {
    const server = await createTemporaryServer();

    const response = await server.app.inject({
      method: "GET",
      url: "/runs/missing"
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Run not found."
      }
    });

    await server.close();
  });

  it("persists prompt responses for prompts that belong to the run", async () => {
    const server = await createTemporaryServer({
      ids: ["run-1", "prompt-1"],
      timestamps: [
        "2026-06-28T00:00:00.000Z",
        "2026-06-28T00:01:00.000Z",
        "2026-06-28T00:02:00.000Z"
      ]
    });
    const events: RunEvent[] = [];
    const run = server.context.runRepository.createRun(
      "https://jobs.example.com/apply/123"
    );
    const prompt = server.context.runRepository.createPrompt({
      runId: run.id,
      fieldLabel: "Expected salary",
      normalizedFieldLabel: "expected salary",
      controlType: "text",
      pageHost: "jobs.example.com",
      message: "Please answer expected salary."
    });
    server.context.eventPublisher.subscribeToRun(run.id, (event) => {
      events.push(event);
    });

    const response = await server.app.inject({
      method: "POST",
      url: `/runs/${run.id}/prompts/${prompt.id}/respond`,
      payload: {
        response: {
          action: "answer",
          answerType: "text",
          value: "100000",
          saveForReuse: true
        }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      run: {
        id: run.id,
        status: "pending"
      },
      prompt: {
        id: prompt.id,
        runId: run.id,
        status: "answered",
        response: {
          action: "answer",
          answerType: "text",
          value: "100000",
          saveForReuse: true
        }
      }
    });
    expect(server.context.runRepository.getPrompt(prompt.id)?.status).toBe(
      "answered"
    );
    expect(events.map((event) => event.eventType)).toEqual([
      "promptAnswered",
      "runStepAdded"
    ]);

    await server.close();
  });

  it("rejects invalid prompt responses with a structured error", async () => {
    const server = await createTemporaryServer({
      ids: ["run-1", "prompt-1"]
    });
    const run = server.context.runRepository.createRun(
      "https://jobs.example.com/apply/123"
    );
    const prompt = server.context.runRepository.createPrompt({
      runId: run.id,
      fieldLabel: "Work authorization",
      normalizedFieldLabel: "work authorization",
      controlType: "radio",
      pageHost: "jobs.example.com",
      message: "Please confirm work authorization."
    });

    const response = await server.app.inject({
      method: "POST",
      url: `/runs/${run.id}/prompts/${prompt.id}/respond`,
      payload: {
        response: {
          action: "skip",
          saveForReuse: true
        }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid prompt response payload."
      }
    });

    await server.close();
  });

  it("rejects prompt responses for prompts owned by another run", async () => {
    const server = await createTemporaryServer({
      ids: ["run-1", "run-2", "prompt-1"]
    });
    const firstRun = server.context.runRepository.createRun(
      "https://jobs.example.com/apply/123"
    );
    const secondRun = server.context.runRepository.createRun(
      "https://jobs.example.com/apply/456"
    );
    const prompt = server.context.runRepository.createPrompt({
      runId: secondRun.id,
      fieldLabel: "Work authorization",
      normalizedFieldLabel: "work authorization",
      controlType: "radio",
      pageHost: "jobs.example.com",
      message: "Please confirm work authorization."
    });

    const response = await server.app.inject({
      method: "POST",
      url: `/runs/${firstRun.id}/prompts/${prompt.id}/respond`,
      payload: {
        response: {
          action: "skip",
          saveForReuse: false
        }
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Prompt not found for run."
      }
    });

    await server.close();
  });

  it("streams run events as Server-Sent Events", async () => {
    const server = await createTemporaryServer({
      ids: ["run-1"],
      timestamps: ["2026-06-28T00:00:00.000Z"]
    });
    const run = server.context.runRepository.createRun(
      "https://jobs.example.com/apply/123"
    );

    const responsePromise = server.app.inject({
      method: "GET",
      url: `/runs/${run.id}/events`
    });
    await waitForSubscription();

    server.context.eventPublisher.publish({
      schemaVersion: 1,
      eventType: "runStatusChanged",
      runId: run.id,
      status: "completed",
      at: "2026-06-28T00:01:00.000Z"
    });

    const response = await responsePromise;
    const payload = response.body;

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/event-stream");
    expect(payload).toContain(": connected\n\n");
    expect(payload).toContain("event: runStatusChanged\n");
    expect(payload).toContain(
      'data: {"schemaVersion":1,"eventType":"runStatusChanged","runId":"run-1","status":"completed","at":"2026-06-28T00:01:00.000Z"}\n\n'
    );

    await server.close();
  });

  it("returns a structured error when opening events for a missing run", async () => {
    const server = await createTemporaryServer();

    const response = await server.app.inject({
      method: "GET",
      url: "/runs/missing/events"
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Run not found."
      }
    });

    await server.close();
  });
});

interface TemporaryServerOptions {
  readonly ids?: string[];
  readonly timestamps?: string[];
}

async function createTemporaryServer(options: TemporaryServerOptions = {}) {
  return createServerApp({
    runtimePaths: createTemporaryRuntimePaths(),
    browserService: createFakeBrowserService(),
    siteAdapter: createEmptySiteAdapter(),
    createId: createIds(options.ids ?? []),
    now: createClock(options.timestamps ?? [])
  });
}

function createTemporaryRuntimePaths() {
  const temporaryDirectory = mkdtempSync(
    path.join(os.tmpdir(), "fast-app-run-routes-")
  );
  temporaryDirectories.push(temporaryDirectory);

  return loadServerRuntimePaths({
    FAST_APP_PROJECT_ROOT: temporaryDirectory,
    FAST_APP_DATABASE_PATH: "data/app.db",
    FAST_APP_BROWSER_PROFILE_PATH: "data/browser-profile",
    FAST_APP_LOGS_PATH: "data/logs",
    FAST_APP_SCREENSHOTS_PATH: "data/screenshots",
    FAST_APP_ALLOWED_RESUME_PATHS: "data/resumes"
  });
}

function createClock(timestamps: string[]): () => string {
  return () => timestamps.shift() ?? new Date().toISOString();
}

function createIds(ids: string[]): () => string {
  return () => ids.shift() ?? crypto.randomUUID();
}

function createFakeBrowserService(): BrowserService {
  return {
    browserProfilePath: "/tmp/fast-app-browser-profile",
    async openContext() {
      return {} as Awaited<ReturnType<BrowserService["openContext"]>>;
    },
    async openPage() {
      return {
        url: () => "https://jobs.example.com/apply/123"
      } as Awaited<ReturnType<BrowserService["openPage"]>>;
    },
    async close() {
      return undefined;
    }
  };
}

function createEmptySiteAdapter(): SiteAdapter {
  return {
    async scanPage() {
      return [];
    },
    async fillField() {
      throw new Error("No fields should be filled in this route test.");
    },
    async classifyContinuationControls() {
      return [];
    }
  };
}

async function waitForSubscription(): Promise<void> {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}
