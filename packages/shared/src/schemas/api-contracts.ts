import { z } from "zod";

import { applicantProfileSchema } from "./applicant-profile.js";
import {
  applicationRunSchema,
  promptResponseSchema,
  promptSchema,
  runStepSchema
} from "./application-run.js";
import {
  learnedAnswerSchema,
  learnedAnswerStateSchema,
  learnedAnswerValueSchema
} from "./learned-answer.js";

const nonEmptyString = z.string().trim().min(1);
const nullableOptionalString = z.union([z.string().trim().min(1), z.null()]).optional();

export const createRunRequestSchema = z.object({
  jobUrl: z.string().trim().url()
});

export const createRunResponseSchema = z.object({
  run: applicationRunSchema
});

export const getRunResponseSchema = z.object({
  run: applicationRunSchema,
  currentPrompt: promptSchema.optional(),
  steps: z.array(runStepSchema)
});

export const getProfileResponseSchema = z.object({
  profile: applicantProfileSchema.nullable()
});

export const updateProfileRequestSchema = applicantProfileSchema;

export const updateProfileResponseSchema = z.object({
  profile: applicantProfileSchema
});

export const listMemoryResponseSchema = z.object({
  items: z.array(learnedAnswerSchema)
});

export const updateLearnedAnswerRequestSchema = z
  .object({
    rawLabel: nonEmptyString.optional(),
    normalizedLabel: nonEmptyString.optional(),
    pagePathPattern: nullableOptionalString,
    nearbyContext: nullableOptionalString,
    state: learnedAnswerStateSchema.optional(),
    answer: learnedAnswerValueSchema.optional()
  })
  .refine(
    (value) =>
      value.rawLabel !== undefined ||
      value.normalizedLabel !== undefined ||
      value.pagePathPattern !== undefined ||
      value.nearbyContext !== undefined ||
      value.state !== undefined ||
      value.answer !== undefined,
    {
      message: "At least one learned-answer field must be provided"
    }
  );

export const updateLearnedAnswerResponseSchema = z.object({
  item: learnedAnswerSchema
});

export const respondToPromptRequestSchema = z.object({
  response: promptResponseSchema
});

export const respondToPromptResponseSchema = z.object({
  run: applicationRunSchema,
  prompt: promptSchema
});

export type CreateRunRequest = z.infer<typeof createRunRequestSchema>;
export type CreateRunResponse = z.infer<typeof createRunResponseSchema>;
export type GetRunResponse = z.infer<typeof getRunResponseSchema>;
export type GetProfileResponse = z.infer<typeof getProfileResponseSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type UpdateProfileResponse = z.infer<typeof updateProfileResponseSchema>;
export type ListMemoryResponse = z.infer<typeof listMemoryResponseSchema>;
export type UpdateLearnedAnswerRequest = z.infer<
  typeof updateLearnedAnswerRequestSchema
>;
export type UpdateLearnedAnswerResponse = z.infer<
  typeof updateLearnedAnswerResponseSchema
>;
export type RespondToPromptRequest = z.infer<
  typeof respondToPromptRequestSchema
>;
export type RespondToPromptResponse = z.infer<
  typeof respondToPromptResponseSchema
>;
