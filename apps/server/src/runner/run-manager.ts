import {
  createRunResponseSchema,
  type LearnedAnswerValue,
  respondToPromptResponseSchema,
  runEventSchemaVersion,
  type ApplicationRun,
  type CreateRunResponse,
  type Prompt,
  type PromptResponse,
  type RespondToPromptResponse,
  type RunStatus
} from "@fast-app/shared";
import type { Page } from "playwright";

import {
  createGenericDomAdapter,
  createScanStepMetadata
} from "../adapters/generic-dom-adapter.js";
import type { SiteAdapter } from "../adapters/site-adapter.js";
import type { BrowserService } from "../browser/playwright.js";
import type { MemoryRepository } from "../memory/memory-repository.js";
import type { ProfileRepository } from "../profile/profile-repository.js";
import { resolveField, type FieldDescriptor, type ResolverDecision } from "../resolvers/index.js";
import type { PromptBridge } from "./prompt-bridge.js";
import type { RunRepository } from "./run-repository.js";
import type { RunEventPublisher } from "./step-publisher.js";

const terminalStatuses = new Set<RunStatus>([
  "waitingForReview",
  "failed",
  "canceled",
  "completed"
]);

export interface RunManager {
  startRun(jobUrl: string): Promise<CreateRunResponse>;
  respondToPrompt(input: RespondToPromptInput): Promise<RespondToPromptResponse | undefined>;
  cancelRun(runId: string): ApplicationRun | undefined;
}

export interface RespondToPromptInput {
  readonly runId: string;
  readonly promptId: string;
  readonly response: PromptResponse;
}

export interface CreateRunManagerOptions {
  readonly browserService: BrowserService;
  readonly siteAdapter?: SiteAdapter;
  readonly profileRepository: ProfileRepository;
  readonly memoryRepository: MemoryRepository;
  readonly runRepository: RunRepository;
  readonly eventPublisher: RunEventPublisher;
  readonly promptBridge: PromptBridge;
  readonly now?: () => string;
}

interface ActiveRunSession {
  readonly runId: string;
  readonly page: Page;
  readonly fields: readonly FieldDescriptor[];
  nextFieldIndex: number;
  promptField: FieldDescriptor | undefined;
}

export function createRunManager(options: CreateRunManagerOptions): RunManager {
  const now = options.now ?? (() => new Date().toISOString());
  const siteAdapter = options.siteAdapter ?? createGenericDomAdapter();
  let activeSession: ActiveRunSession | undefined;

  return {
    async startRun(jobUrl: string): Promise<CreateRunResponse> {
      assertNoActiveRun(activeSession, options.runRepository);
      const run = options.runRepository.createRun(jobUrl);
      publishStatus(options, run.id, "pending", now);
      appendStep(options, {
        runId: run.id,
        status: "pending",
        level: "info",
        message: "Run created."
      });

      try {
        transition(options, run.id, "starting", "Starting visible browser.", now);
        const page = await options.browserService.openPage(run.jobUrl);

        transition(options, run.id, "scanning", "Scanning the current page.", now, {
          pageUrl: page.url()
        });
        const fields = await siteAdapter.scanPage(page);
        const scanMetadata = createScanStepMetadata(page.url(), fields.length);
        appendStep(options, {
          runId: run.id,
          status: "scanning",
          level: "info",
          message: `Scanned ${scanMetadata.fieldCount ?? fields.length} fields.`,
          pageUrl: scanMetadata.pageUrl
        });

        activeSession = {
          runId: run.id,
          page,
          fields,
          nextFieldIndex: 0,
          promptField: undefined
        };
        await processFields(activeSession, options, siteAdapter, now);
      } catch (error) {
        activeSession = failRun(options, run.id, error, now);
      }

      return createRunResponseSchema.parse({
        run: options.runRepository.getRun(run.id) ?? run
      });
    },

    async respondToPrompt(
      input: RespondToPromptInput
    ): Promise<RespondToPromptResponse | undefined> {
      const session =
        activeSession?.runId === input.runId ? activeSession : undefined;
      const promptResult = options.promptBridge.answerPrompt(input);

      if (!promptResult) {
        return undefined;
      }

      appendStep(options, {
        runId: input.runId,
        status: "filling",
        level: "info",
        message: promptResult.savedForReuse
          ? "Prompt answered and saved for reuse."
          : "Prompt answered.",
        promptId: promptResult.prompt.id
      });

      if (session) {
        try {
          transition(
            options,
            input.runId,
            "filling",
            "Resuming after prompt response.",
            now,
            { promptId: promptResult.prompt.id }
          );
          await applyPromptResponse(session, promptResult.prompt, options, siteAdapter);
          await processFields(session, options, siteAdapter, now);
        } catch (error) {
          activeSession = failRun(options, input.runId, error, now);
        }
      }

      return respondToPromptResponseSchema.parse({
        run: options.runRepository.getRun(input.runId),
        prompt: promptResult.prompt
      });
    },

    cancelRun(runId: string): ApplicationRun | undefined {
      const run = options.runRepository.updateRunStatus(runId, "canceled");

      if (!run) {
        return undefined;
      }

      appendStep(options, {
        runId,
        status: "canceled",
        level: "warning",
        message: "Run canceled by user."
      });
      publishStatus(options, runId, "canceled", now);

      if (activeSession?.runId === runId) {
        activeSession = undefined;
      }

      return options.runRepository.getRun(runId) ?? run;
    }
  };

  async function processFields(
    session: ActiveRunSession,
    managerOptions: CreateRunManagerOptions,
    adapter: SiteAdapter,
    currentTime: () => string
  ): Promise<void> {
    const profile = managerOptions.profileRepository.getProfile();
    const learnedAnswers = managerOptions.memoryRepository.listLearnedAnswers();

    if (managerOptions.runRepository.getRun(session.runId)?.status !== "filling") {
      transition(
        managerOptions,
        session.runId,
        "filling",
        "Resolving and filling safe fields.",
        currentTime,
        { pageUrl: session.page.url() }
      );
    }

    while (session.nextFieldIndex < session.fields.length) {
      const field = session.fields[session.nextFieldIndex];

      if (!field) {
        break;
      }

      const decision = resolveField({
        field,
        learnedAnswers,
        ...(profile ? { profile } : {})
      });

      if (decision.action === "prompt") {
        session.promptField = field;
        session.nextFieldIndex += 1;
        const prompt = managerOptions.promptBridge.createPromptForField({
          runId: session.runId,
          field,
          message: decision.message
        });
        transition(
          managerOptions,
          session.runId,
          "prompting",
          "Paused for user input.",
          currentTime,
          {
            fieldLabel: field.label,
            promptId: prompt.id,
            pageUrl: session.page.url()
          }
        );
        return;
      }

      await applyDecision(session, decision, managerOptions, adapter);
      session.nextFieldIndex += 1;
    }

    transition(
      managerOptions,
      session.runId,
      "waitingForReview",
      "Current page filled as far as safely possible. Waiting for human review.",
      currentTime,
      { pageUrl: session.page.url() }
    );
    activeSession = undefined;
  }
}

async function applyDecision(
  session: ActiveRunSession,
  decision: ResolverDecision,
  options: CreateRunManagerOptions,
  siteAdapter: SiteAdapter
): Promise<void> {
  const result = await siteAdapter.fillField(session.page, decision);

  if (result.action === "filled") {
    if (decision.action === "fill" && decision.source === "learned-answer") {
      if (decision.learnedAnswerId) {
        options.memoryRepository.markLearnedAnswerUsed(decision.learnedAnswerId);
      }
    }

    appendStep(options, {
      runId: session.runId,
      status: "filling",
      level: "info",
      message: `Filled ${result.field.label}.`,
      pageUrl: result.metadata.pageUrl,
      fieldLabel: result.field.label
    });
    return;
  }

  appendStep(options, {
    runId: session.runId,
    status: "filling",
    level: result.action === "skipped" ? "warning" : "info",
    message:
      result.action === "skipped"
        ? `Skipped ${result.field.label}.`
        : `Prompt needed for ${result.field.label}.`,
    pageUrl: result.metadata.pageUrl,
    fieldLabel: result.field.label
  });
}

async function applyPromptResponse(
  session: ActiveRunSession,
  prompt: Prompt,
  options: CreateRunManagerOptions,
  siteAdapter: SiteAdapter
): Promise<void> {
  const response = prompt.response;
  const field = session.promptField;

  session.promptField = undefined;

  if (!response || response.action === "skip" || !field) {
    appendStep(options, {
      runId: session.runId,
      status: "filling",
      level: "warning",
      message: "Skipped prompted field.",
      promptId: prompt.id,
      fieldLabel: prompt.fieldLabel
    });
    return;
  }

  await applyDecision(
    session,
    {
      action: "fill",
      source: "prompt-response",
      confidence: 1,
      field,
      answer: {
        ...promptResponseAnswer(response)
      },
      reason: "User answered a prompt."
    },
    options,
    siteAdapter
  );
}

function promptResponseAnswer(
  response: Extract<PromptResponse, { action: "answer" }>
): LearnedAnswerValue {
  switch (response.answerType) {
    case "text":
      return {
        answerType: "text",
        value: response.value
      };
    case "boolean":
      return {
        answerType: "boolean",
        value: response.value
      };
    case "option":
      return {
        answerType: "option",
        value: response.value
      };
  }
}

function assertNoActiveRun(
  activeSession: ActiveRunSession | undefined,
  runRepository: RunRepository
): void {
  if (!activeSession) {
    return;
  }

  const activeRun = runRepository.getRun(activeSession.runId);

  if (activeRun && !terminalStatuses.has(activeRun.status)) {
    throw new Error("Only one active run is supported in v1.");
  }
}

function transition(
  options: CreateRunManagerOptions,
  runId: string,
  status: RunStatus,
  message: string,
  now: () => string,
  metadata: {
    readonly pageUrl?: string;
    readonly fieldLabel?: string;
    readonly promptId?: string;
  } = {}
): void {
  options.runRepository.updateRunStatus(runId, status);
  publishStatus(options, runId, status, now);
  appendStep(options, {
    runId,
    status,
    level: status === "prompting" ? "warning" : "info",
    message,
    ...metadata
  });
}

function appendStep(
  options: Pick<CreateRunManagerOptions, "runRepository" | "eventPublisher">,
  input: Parameters<RunRepository["appendRunStep"]>[0]
): void {
  const step = options.runRepository.appendRunStep(input);
  options.eventPublisher.publish({
    schemaVersion: runEventSchemaVersion,
    eventType: "runStepAdded",
    runId: step.runId,
    step,
    at: new Date().toISOString()
  });
}

function publishStatus(
  options: Pick<CreateRunManagerOptions, "eventPublisher">,
  runId: string,
  status: RunStatus,
  now: () => string
): void {
  options.eventPublisher.publish({
    schemaVersion: runEventSchemaVersion,
    eventType: "runStatusChanged",
    runId,
    status,
    at: now()
  });
}

function failRun(
  options: CreateRunManagerOptions,
  runId: string,
  error: unknown,
  now: () => string
): undefined {
  const message =
    error instanceof Error ? error.message : "Run failed for an unknown reason.";
  options.runRepository.updateRunStatus(runId, "failed");
  appendStep(options, {
    runId,
    status: "failed",
    level: "error",
    message: "Run failed before completion."
  });
  publishStatus(options, runId, "failed", now);
  options.eventPublisher.publish({
    schemaVersion: runEventSchemaVersion,
    eventType: "runError",
    runId,
    message,
    at: now()
  });

  return undefined;
}
