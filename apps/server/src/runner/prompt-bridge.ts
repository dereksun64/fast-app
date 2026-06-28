import {
  normalizeLabel,
  runEventSchemaVersion,
  type LearnedAnswerValue,
  type Prompt,
  type PromptResponse
} from "@fast-app/shared";

import type { MemoryRepository } from "../memory/memory-repository.js";
import type { FieldDescriptor } from "../resolvers/index.js";
import type { RunRepository } from "./run-repository.js";
import type { RunEventPublisher } from "./step-publisher.js";

export interface PromptBridge {
  createPromptForField(input: CreatePromptForFieldInput): Prompt;
  answerPrompt(input: AnswerPromptInput): AnswerPromptResult | undefined;
}

export interface CreatePromptForFieldInput {
  readonly runId: string;
  readonly field: FieldDescriptor;
  readonly message: string;
}

export interface AnswerPromptInput {
  readonly runId: string;
  readonly promptId: string;
  readonly response: PromptResponse;
}

export interface AnswerPromptResult {
  readonly prompt: Prompt;
  readonly savedForReuse: boolean;
}

export interface CreatePromptBridgeOptions {
  readonly runRepository: RunRepository;
  readonly memoryRepository: MemoryRepository;
  readonly eventPublisher: RunEventPublisher;
  readonly now?: () => string;
}

export function createPromptBridge(
  options: CreatePromptBridgeOptions
): PromptBridge {
  const now = options.now ?? (() => new Date().toISOString());

  return {
    createPromptForField(input: CreatePromptForFieldInput): Prompt {
      const prompt = options.runRepository.createPrompt({
        runId: input.runId,
        fieldLabel: input.field.label,
        normalizedFieldLabel: normalizeLabel(input.field.label),
        controlType: input.field.controlType,
        pageHost: input.field.pageHost,
        message: input.message,
        ...(input.field.pagePath ? { pagePath: input.field.pagePath } : {}),
        ...(input.field.nearbyContext
          ? { nearbyContext: input.field.nearbyContext }
          : {})
      });

      options.runRepository.setCurrentPrompt(input.runId, prompt.id);
      options.eventPublisher.publish({
        schemaVersion: runEventSchemaVersion,
        eventType: "promptCreated",
        runId: input.runId,
        prompt,
        at: now()
      });

      return prompt;
    },

    answerPrompt(input: AnswerPromptInput): AnswerPromptResult | undefined {
      const prompt = options.runRepository.getPrompt(input.promptId);

      if (!prompt || prompt.runId !== input.runId || prompt.status !== "open") {
        return undefined;
      }

      const answeredPrompt = options.runRepository.answerPrompt(
        input.promptId,
        input.response
      );

      if (!answeredPrompt) {
        return undefined;
      }

      options.runRepository.setCurrentPrompt(input.runId, undefined);
      const savedForReuse = maybeSaveForReuse(
        options.memoryRepository,
        answeredPrompt
      );

      options.eventPublisher.publish({
        schemaVersion: runEventSchemaVersion,
        eventType: "promptAnswered",
        runId: input.runId,
        prompt: answeredPrompt,
        at: now()
      });

      return {
        prompt: answeredPrompt,
        savedForReuse
      };
    }
  };
}

function maybeSaveForReuse(
  memoryRepository: MemoryRepository,
  prompt: Prompt
): boolean {
  const response = prompt.response;

  if (!response || response.action !== "answer" || !response.saveForReuse) {
    return false;
  }

  memoryRepository.createLearnedAnswer({
    rawLabel: prompt.fieldLabel,
    normalizedLabel: prompt.normalizedFieldLabel,
    controlType: prompt.controlType,
    pageHost: prompt.pageHost,
    answer: promptResponseAnswer(response),
    ...(prompt.pagePath ? { pagePathPattern: prompt.pagePath } : {}),
    ...(prompt.nearbyContext ? { nearbyContext: prompt.nearbyContext } : {})
  });

  return true;
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
