export {
  applicantProfileSchema,
  type ApplicantProfile
} from "./schemas/applicant-profile.js";
export {
  applicantProfileFieldAliasEntries,
  applicantProfileFieldAliases,
  applicantProfileFieldKeys,
  type ApplicantProfileFieldKey
} from "./constants/field-aliases.js";
export {
  normalizeHostname,
  normalizeLabel,
  normalizeNearbyContext,
  normalizeWhitespace,
  stripPunctuation
} from "./lib/normalize.js";
export {
  createRunRequestSchema,
  createRunResponseSchema,
  getProfileResponseSchema,
  getRunResponseSchema,
  listMemoryResponseSchema,
  respondToPromptRequestSchema,
  respondToPromptResponseSchema,
  updateLearnedAnswerRequestSchema,
  updateLearnedAnswerResponseSchema,
  updateProfileRequestSchema,
  updateProfileResponseSchema,
  type CreateRunRequest,
  type CreateRunResponse,
  type GetProfileResponse,
  type GetRunResponse,
  type ListMemoryResponse,
  type RespondToPromptRequest,
  type RespondToPromptResponse,
  type UpdateLearnedAnswerRequest,
  type UpdateLearnedAnswerResponse,
  type UpdateProfileRequest,
  type UpdateProfileResponse
} from "./schemas/api-contracts.js";
export {
  applicationRunSchema,
  promptResponseActionSchema,
  promptResponseSchema,
  promptResponseValueSchema,
  promptSchema,
  promptStatusSchema,
  runEventSchema,
  runEventSchemaVersion,
  runStatusSchema,
  runStepLevelSchema,
  runStepSchema,
  type ApplicationRun,
  type Prompt,
  type PromptResponse,
  type PromptResponseAction,
  type PromptResponseValue,
  type PromptStatus,
  type RunEvent,
  type RunStatus,
  type RunStep,
  type RunStepLevel
} from "./schemas/application-run.js";
export {
  learnedAnswerControlTypeSchema,
  learnedAnswerSchema,
  learnedAnswerStateSchema,
  learnedAnswerValueSchema,
  type LearnedAnswer,
  type LearnedAnswerControlType,
  type LearnedAnswerState,
  type LearnedAnswerValue
} from "./schemas/learned-answer.js";

export const workspaceStatus = {
  phase: "phase-1-foundation",
  ready: true
} as const;
