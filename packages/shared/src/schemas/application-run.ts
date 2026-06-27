import { z } from "zod";

import { learnedAnswerControlTypeSchema } from "./learned-answer.js";

const nonEmptyString = z.string().trim().min(1);
const optionalNonEmptyString = nonEmptyString.optional();
const isoDatetime = z.string().datetime({ offset: true });

export const runStatusSchema = z.union([
  z.literal("pending"),
  z.literal("starting"),
  z.literal("scanning"),
  z.literal("filling"),
  z.literal("prompting"),
  z.literal("waitingForReview"),
  z.literal("failed"),
  z.literal("canceled"),
  z.literal("completed")
]);

export const promptStatusSchema = z.union([
  z.literal("open"),
  z.literal("answered"),
  z.literal("skipped")
]);

export const promptResponseActionSchema = z.union([
  z.literal("answer"),
  z.literal("skip")
]);

export const promptResponseValueSchema = z.discriminatedUnion("answerType", [
  z.object({
    answerType: z.literal("text"),
    value: nonEmptyString
  }),
  z.object({
    answerType: z.literal("boolean"),
    value: z.boolean()
  }),
  z.object({
    answerType: z.literal("option"),
    value: nonEmptyString
  })
]);

export const promptResponseSchema = z.union([
  z.object({
    action: z.literal("answer"),
    saveForReuse: z.boolean()
  }).and(promptResponseValueSchema),
  z.object({
    action: z.literal("skip"),
    saveForReuse: z.literal(false)
  })
]);

export const promptSchema = z.object({
  id: nonEmptyString,
  runId: nonEmptyString,
  status: promptStatusSchema,
  fieldLabel: nonEmptyString,
  normalizedFieldLabel: nonEmptyString,
  controlType: learnedAnswerControlTypeSchema,
  pageHost: nonEmptyString.transform((value) => value.toLowerCase()),
  pagePath: optionalNonEmptyString,
  nearbyContext: optionalNonEmptyString,
  message: nonEmptyString,
  response: promptResponseSchema.optional(),
  createdAt: isoDatetime,
  answeredAt: isoDatetime.optional()
});

export const runStepLevelSchema = z.union([
  z.literal("info"),
  z.literal("warning"),
  z.literal("error")
]);

export const runStepSchema = z.object({
  id: nonEmptyString,
  runId: nonEmptyString,
  status: runStatusSchema,
  level: runStepLevelSchema,
  message: nonEmptyString,
  pageUrl: optionalNonEmptyString,
  fieldLabel: optionalNonEmptyString,
  promptId: optionalNonEmptyString,
  createdAt: isoDatetime
});

export const applicationRunSchema = z.object({
  id: nonEmptyString,
  jobUrl: z.string().trim().url(),
  status: runStatusSchema,
  createdAt: isoDatetime,
  updatedAt: isoDatetime,
  startedAt: isoDatetime.optional(),
  completedAt: isoDatetime.optional(),
  failedAt: isoDatetime.optional(),
  canceledAt: isoDatetime.optional(),
  currentPromptId: optionalNonEmptyString,
  latestStep: runStepSchema.optional()
});

export const runEventSchemaVersion = 1 as const;

export const runEventSchema = z.discriminatedUnion("eventType", [
  z.object({
    schemaVersion: z.literal(runEventSchemaVersion),
    eventType: z.literal("runStatusChanged"),
    runId: nonEmptyString,
    status: runStatusSchema,
    at: isoDatetime
  }),
  z.object({
    schemaVersion: z.literal(runEventSchemaVersion),
    eventType: z.literal("runStepAdded"),
    runId: nonEmptyString,
    step: runStepSchema,
    at: isoDatetime
  }),
  z.object({
    schemaVersion: z.literal(runEventSchemaVersion),
    eventType: z.literal("promptCreated"),
    runId: nonEmptyString,
    prompt: promptSchema,
    at: isoDatetime
  }),
  z.object({
    schemaVersion: z.literal(runEventSchemaVersion),
    eventType: z.literal("promptAnswered"),
    runId: nonEmptyString,
    prompt: promptSchema,
    at: isoDatetime
  }),
  z.object({
    schemaVersion: z.literal(runEventSchemaVersion),
    eventType: z.literal("runError"),
    runId: nonEmptyString,
    message: nonEmptyString,
    at: isoDatetime
  })
]);

export type RunStatus = z.infer<typeof runStatusSchema>;
export type PromptStatus = z.infer<typeof promptStatusSchema>;
export type PromptResponseAction = z.infer<typeof promptResponseActionSchema>;
export type PromptResponseValue = z.infer<typeof promptResponseValueSchema>;
export type PromptResponse = z.infer<typeof promptResponseSchema>;
export type Prompt = z.infer<typeof promptSchema>;
export type RunStepLevel = z.infer<typeof runStepLevelSchema>;
export type RunStep = z.infer<typeof runStepSchema>;
export type ApplicationRun = z.infer<typeof applicationRunSchema>;
export type RunEvent = z.infer<typeof runEventSchema>;
