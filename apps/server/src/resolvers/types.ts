import type {
  ApplicantProfile,
  ApplicantProfileFieldKey,
  LearnedAnswer,
  LearnedAnswerControlType,
  PromptResponseValue
} from "@fast-app/shared";

export type FieldControlType = LearnedAnswerControlType;

export interface FieldOptionDescriptor {
  readonly label: string;
  readonly value?: string;
}

export interface FieldDescriptor {
  readonly id?: string;
  readonly label: string;
  readonly controlType: FieldControlType;
  readonly pageHost: string;
  readonly pagePath?: string;
  readonly placeholder?: string;
  readonly name?: string;
  readonly ariaLabel?: string;
  readonly nearbyContext?: string;
  readonly options?: readonly FieldOptionDescriptor[];
  readonly required?: boolean;
}

export type ResolverDecisionSource =
  | "profile"
  | "learned-answer"
  | "prompt-response";

export type ResolverPromptReason =
  | "missing-profile-value"
  | "low-confidence"
  | "ambiguous-option"
  | "open-ended-question"
  | "unknown-field"
  | "unsupported-control";

export type ResolverSkipReason = "unsafe-control" | "no-compatible-option";

export type ResolverDecision =
  | {
      readonly action: "fill";
      readonly source: ResolverDecisionSource;
      readonly confidence: number;
      readonly field: FieldDescriptor;
      readonly answer: PromptResponseValue;
      readonly profileFieldKey?: ApplicantProfileFieldKey | "firstName" | "lastName";
      readonly learnedAnswerId?: string;
      readonly reason: string;
    }
  | {
      readonly action: "prompt";
      readonly confidence: number;
      readonly field: FieldDescriptor;
      readonly reason: ResolverPromptReason;
      readonly message: string;
    }
  | {
      readonly action: "skip";
      readonly confidence: number;
      readonly field: FieldDescriptor;
      readonly reason: ResolverSkipReason;
      readonly message: string;
    };

export interface FieldResolverInput {
  readonly field: FieldDescriptor;
  readonly profile?: ApplicantProfile;
  readonly learnedAnswers?: readonly LearnedAnswer[];
}

export type FieldResolver = (
  input: FieldResolverInput
) => ResolverDecision | undefined;
