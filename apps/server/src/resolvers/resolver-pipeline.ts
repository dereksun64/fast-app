import { normalizeLabel } from "@fast-app/shared";

import { resolveFromLearnedAnswers } from "./learned-answer-resolver.js";
import { resolveFromProfile } from "./profile-resolver.js";
import {
  createPromptDecision,
  hasAmbiguousOptions,
  isOpenEndedControl
} from "./safety.js";
import type { FieldResolverInput, ResolverDecision } from "./types.js";

export function resolveField(input: FieldResolverInput): ResolverDecision {
  const profileDecision = resolveFromProfile(input);

  if (profileDecision?.action === "fill") {
    return profileDecision;
  }

  const learnedAnswerDecision = resolveFromLearnedAnswers(input);

  if (learnedAnswerDecision?.action === "fill") {
    return learnedAnswerDecision;
  }

  if (profileDecision) {
    return profileDecision;
  }

  if (learnedAnswerDecision) {
    return learnedAnswerDecision;
  }

  return fallbackDecision(input);
}

function fallbackDecision(input: FieldResolverInput): ResolverDecision {
  const { field } = input;

  if (isOpenEndedControl(field)) {
    return createPromptDecision(
      field,
      "open-ended-question",
      "This looks like an open-ended question. Ask the user instead of generating an answer."
    );
  }

  if (hasAmbiguousOptions(field)) {
    return createPromptDecision(
      field,
      "ambiguous-option",
      "This option field is ambiguous, so ask the user instead of guessing."
    );
  }

  const normalizedLabel = normalizeLabel(field.label);

  if (!normalizedLabel) {
    return createPromptDecision(
      field,
      "unknown-field",
      "This field has no usable label, so ask the user before filling it."
    );
  }

  return createPromptDecision(
    field,
    "low-confidence",
    "No confident profile or learned-answer match was found."
  );
}
