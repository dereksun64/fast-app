import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);
const optionalNonEmptyString = nonEmptyString.optional();

export const learnedAnswerControlTypeSchema = z.union([
  z.literal("text"),
  z.literal("textarea"),
  z.literal("select"),
  z.literal("checkbox"),
  z.literal("radio")
]);

export const learnedAnswerStateSchema = z.union([
  z.literal("enabled"),
  z.literal("disabled")
]);

export const learnedAnswerValueSchema = z.discriminatedUnion("answerType", [
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

export const learnedAnswerSchema = z
  .object({
    id: nonEmptyString,
    rawLabel: nonEmptyString,
    normalizedLabel: nonEmptyString,
    controlType: learnedAnswerControlTypeSchema,
    pageHost: nonEmptyString.transform((value) => value.toLowerCase()),
    pagePathPattern: optionalNonEmptyString,
    nearbyContext: optionalNonEmptyString,
    state: learnedAnswerStateSchema,
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    lastUsedAt: z.string().datetime({ offset: true }).optional()
  })
  .and(learnedAnswerValueSchema);

export type LearnedAnswerControlType = z.infer<
  typeof learnedAnswerControlTypeSchema
>;
export type LearnedAnswerState = z.infer<typeof learnedAnswerStateSchema>;
export type LearnedAnswerValue = z.infer<typeof learnedAnswerValueSchema>;
export type LearnedAnswer = z.infer<typeof learnedAnswerSchema>;
