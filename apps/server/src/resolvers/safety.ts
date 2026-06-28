import {
  normalizeHostname,
  normalizeLabel,
  normalizeNearbyContext
} from "@fast-app/shared";

import type {
  FieldDescriptor,
  FieldOptionDescriptor,
  ResolverDecision
} from "./types.js";

const yesValues = new Set(["yes", "y", "true"]);
const noValues = new Set(["no", "n", "false"]);

export function normalizeFieldLabel(field: FieldDescriptor): string {
  return normalizeLabel(
    [
      field.label,
      field.ariaLabel,
      field.placeholder,
      field.name
    ]
      .filter((value): value is string => Boolean(value))
      .join(" ")
  );
}

export function normalizeFieldContext(field: FieldDescriptor): string {
  return normalizeNearbyContext(field.nearbyContext ?? field.label);
}

export function normalizeFieldHost(field: FieldDescriptor): string {
  return normalizeHostname(field.pageHost);
}

export function createPromptDecision(
  field: FieldDescriptor,
  reason:
    | "missing-profile-value"
    | "low-confidence"
    | "ambiguous-option"
    | "open-ended-question"
    | "unknown-field"
    | "unsupported-control",
  message: string
): ResolverDecision {
  return {
    action: "prompt",
    confidence: 0,
    field,
    reason,
    message
  };
}

export function createSkipDecision(
  field: FieldDescriptor,
  reason: "unsafe-control" | "no-compatible-option",
  message: string
): ResolverDecision {
  return {
    action: "skip",
    confidence: 0,
    field,
    reason,
    message
  };
}

export function isTextLikeControl(field: FieldDescriptor): boolean {
  return field.controlType === "text";
}

export function isOpenEndedControl(field: FieldDescriptor): boolean {
  return field.controlType === "textarea";
}

export function findExactOption(
  options: readonly FieldOptionDescriptor[] | undefined,
  expectedValue: string
): FieldOptionDescriptor | undefined {
  if (!options || options.length === 0) {
    return undefined;
  }

  const normalizedExpected = normalizeLabel(expectedValue);

  return options.find((option) => {
    const normalizedLabel = normalizeLabel(option.label);
    const normalizedValue = option.value
      ? normalizeLabel(option.value)
      : normalizedLabel;

    return (
      normalizedLabel === normalizedExpected ||
      normalizedValue === normalizedExpected
    );
  });
}

export function findBooleanOption(
  options: readonly FieldOptionDescriptor[] | undefined,
  expectedValue: boolean
): FieldOptionDescriptor | undefined {
  if (!options || options.length === 0) {
    return undefined;
  }

  const expectedValues = expectedValue ? yesValues : noValues;

  return options.find((option) => {
    const normalizedValues = [
      normalizeLabel(option.label),
      option.value ? normalizeLabel(option.value) : undefined
    ].filter((value): value is string => Boolean(value));

    return normalizedValues.some((value) => expectedValues.has(value));
  });
}

export function optionAnswerValue(option: FieldOptionDescriptor): string {
  return option.value ?? option.label;
}

export function hasAmbiguousOptions(field: FieldDescriptor): boolean {
  if (field.controlType !== "select" && field.controlType !== "radio") {
    return false;
  }

  return !field.options || field.options.length === 0;
}
