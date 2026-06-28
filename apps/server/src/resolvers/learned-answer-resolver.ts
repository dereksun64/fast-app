import {
  normalizeHostname,
  normalizeLabel,
  normalizeNearbyContext,
  type LearnedAnswer,
  type PromptResponseValue
} from "@fast-app/shared";

import {
  createPromptDecision,
  findExactOption,
  isOpenEndedControl,
  normalizeFieldContext,
  normalizeFieldHost,
  normalizeFieldLabel,
  optionAnswerValue
} from "./safety.js";
import type {
  FieldDescriptor,
  FieldResolver,
  ResolverDecision
} from "./types.js";

const learnedLabelThreshold = 0.9;
const contextThreshold = 0.8;

interface LearnedAnswerMatch {
  readonly learnedAnswer: LearnedAnswer;
  readonly confidence: number;
}

export const resolveFromLearnedAnswers: FieldResolver = ({
  field,
  learnedAnswers = []
}): ResolverDecision | undefined => {
  if (isOpenEndedControl(field)) {
    return createPromptDecision(
      field,
      "open-ended-question",
      "This looks like an open-ended question. Ask the user instead of reusing an answer automatically."
    );
  }

  const match = findLearnedAnswerMatch(field, learnedAnswers);

  if (!match) {
    return undefined;
  }

  const answer = compatibleAnswerForField(field, match.learnedAnswer);

  if (!answer) {
    return createPromptDecision(
      field,
      "ambiguous-option",
      "A learned answer matched the question, but it is not compatible with this field's visible choices."
    );
  }

  return {
    action: "fill",
    source: "learned-answer",
    confidence: match.confidence,
    field,
    answer,
    learnedAnswerId: match.learnedAnswer.id,
    reason: "Matched enabled learned answer with strong label and context."
  };
};

function findLearnedAnswerMatch(
  field: FieldDescriptor,
  learnedAnswers: readonly LearnedAnswer[]
): LearnedAnswerMatch | undefined {
  return learnedAnswers
    .filter((learnedAnswer) => learnedAnswer.state === "enabled")
    .filter((learnedAnswer) => learnedAnswer.controlType === field.controlType)
    .map((learnedAnswer) => {
      const labelConfidence = labelSimilarity(
        normalizeFieldLabel(field),
        learnedAnswer.normalizedLabel
      );
      const contextConfidence = contextSimilarity(field, learnedAnswer);
      const confidence = Math.min(labelConfidence, contextConfidence);

      return {
        learnedAnswer,
        confidence
      };
    })
    .filter(
      (match) =>
        match.confidence >= learnedLabelThreshold &&
        contextSimilarity(field, match.learnedAnswer) >= contextThreshold
    )
    .sort((left, right) => right.confidence - left.confidence)[0];
}

function labelSimilarity(left: string, right: string): number {
  const normalizedRight = normalizeLabel(right);

  if (left === normalizedRight) {
    return 1;
  }

  if (left.includes(normalizedRight) || normalizedRight.includes(left)) {
    return 0.94;
  }

  return tokenSimilarity(left, normalizedRight);
}

function contextSimilarity(
  field: FieldDescriptor,
  learnedAnswer: LearnedAnswer
): number {
  const sameHost =
    normalizeFieldHost(field) === normalizeHostname(learnedAnswer.pageHost);
  const pathMatches = pathPatternMatches(
    field.pagePath,
    learnedAnswer.pagePathPattern
  );

  if (sameHost && pathMatches) {
    return 1;
  }

  const fieldContext = normalizeFieldContext(field);
  const learnedContext = learnedAnswer.nearbyContext
    ? normalizeNearbyContext(learnedAnswer.nearbyContext)
    : "";

  const contextScore = tokenSimilarity(fieldContext, learnedContext);

  return contextScore >= contextThreshold ? contextScore : 0;
}

function pathPatternMatches(
  pagePath: string | undefined,
  pagePathPattern: string | undefined
): boolean {
  if (!pagePathPattern) {
    return true;
  }

  if (!pagePath) {
    return false;
  }

  if (pagePathPattern.endsWith("/*")) {
    return pagePath.startsWith(pagePathPattern.slice(0, -1));
  }

  return pagePath === pagePathPattern;
}

function tokenSimilarity(left: string, right: string): number {
  if (!left || !right) {
    return 0;
  }

  const leftTokens = new Set(left.split(" ").filter(Boolean));
  const rightTokens = new Set(right.split(" ").filter(Boolean));
  const matchingTokens = [...leftTokens].filter((token) =>
    rightTokens.has(token)
  ).length;
  const largerTokenCount = Math.max(leftTokens.size, rightTokens.size);

  return largerTokenCount === 0 ? 0 : matchingTokens / largerTokenCount;
}

function compatibleAnswerForField(
  field: FieldDescriptor,
  learnedAnswer: LearnedAnswer
): PromptResponseValue | undefined {
  if (
    learnedAnswer.answerType === "text" &&
    (field.controlType === "text" || field.controlType === "textarea")
  ) {
    return {
      answerType: "text",
      value: learnedAnswer.value
    };
  }

  if (
    learnedAnswer.answerType === "boolean" &&
    field.controlType === "checkbox"
  ) {
    return {
      answerType: "boolean",
      value: learnedAnswer.value
    };
  }

  if (
    learnedAnswer.answerType === "option" &&
    (field.controlType === "select" || field.controlType === "radio")
  ) {
    const option = findExactOption(field.options, learnedAnswer.value);

    if (!option) {
      return undefined;
    }

    return {
      answerType: "option",
      value: optionAnswerValue(option)
    };
  }

  return undefined;
}
