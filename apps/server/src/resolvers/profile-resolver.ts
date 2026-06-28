import {
  applicantProfileFieldAliasEntries,
  normalizeLabel,
  type ApplicantProfile,
  type ApplicantProfileFieldKey,
  type PromptResponseValue
} from "@fast-app/shared";

import {
  createPromptDecision,
  createSkipDecision,
  findBooleanOption,
  findExactOption,
  hasAmbiguousOptions,
  isOpenEndedControl,
  isTextLikeControl,
  normalizeFieldLabel,
  optionAnswerValue
} from "./safety.js";
import type {
  FieldDescriptor,
  FieldResolver,
  ResolverDecision
} from "./types.js";

const profileMatchThreshold = 0.92;

const splitNameAliases = [
  {
    fieldKey: "firstName" as const,
    aliases: ["first name", "given name", "preferred first name"]
  },
  {
    fieldKey: "lastName" as const,
    aliases: ["last name", "family name", "surname"]
  }
] as const;

type ProfileResolutionKey =
  | ApplicantProfileFieldKey
  | (typeof splitNameAliases)[number]["fieldKey"];

interface ProfileFieldMatch {
  readonly fieldKey: ProfileResolutionKey;
  readonly confidence: number;
  readonly matchedAlias: string;
}

export const resolveFromProfile: FieldResolver = ({
  field,
  profile
}): ResolverDecision | undefined => {
  if (!profile) {
    return undefined;
  }

  if (isOpenEndedControl(field)) {
    return createPromptDecision(
      field,
      "open-ended-question",
      "This looks like an open-ended question. Ask the user instead of generating an answer."
    );
  }

  const match = findProfileFieldMatch(field);

  if (!match || match.confidence < profileMatchThreshold) {
    return undefined;
  }

  const profileValue = valueForProfileField(profile, match.fieldKey);

  if (profileValue === undefined || profileValue === "") {
    return createPromptDecision(
      field,
      "missing-profile-value",
      "The profile field matched, but the saved profile does not have a usable value."
    );
  }

  return decisionForMatchedProfileValue(field, match, profileValue);
};

function findProfileFieldMatch(
  field: FieldDescriptor
): ProfileFieldMatch | undefined {
  const normalizedFieldLabel = normalizeFieldLabel(field);
  const candidates = [
    ...splitNameAliases,
    ...applicantProfileFieldAliasEntries
  ].flatMap((entry) =>
    entry.aliases.map((alias) => {
      const normalizedAlias = normalizeLabel(alias);

      return {
        fieldKey: entry.fieldKey,
        confidence: confidenceForAlias(normalizedFieldLabel, normalizedAlias),
        matchedAlias: normalizedAlias
      };
    })
  );

  return candidates
    .filter((candidate) => candidate.confidence > 0)
    .sort((left, right) => right.confidence - left.confidence)[0];
}

function confidenceForAlias(
  normalizedFieldLabel: string,
  normalizedAlias: string
): number {
  if (normalizedFieldLabel === normalizedAlias) {
    return 1;
  }

  if (normalizedFieldLabel.startsWith(`${normalizedAlias} `)) {
    return 0.96;
  }

  if (normalizedFieldLabel.endsWith(` ${normalizedAlias}`)) {
    return 0.94;
  }

  if (normalizedFieldLabel.includes(` ${normalizedAlias} `)) {
    return 0.93;
  }

  return 0;
}

function valueForProfileField(
  profile: ApplicantProfile,
  fieldKey: ProfileResolutionKey
): string | boolean | undefined {
  if (fieldKey === "firstName") {
    return splitFullName(profile.fullName).firstName;
  }

  if (fieldKey === "lastName") {
    return splitFullName(profile.fullName).lastName;
  }

  return profile[fieldKey];
}

function splitFullName(fullName: string): {
  readonly firstName: string;
  readonly lastName: string;
} {
  const parts = fullName.trim().split(/\s+/);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : ""
  };
}

function decisionForMatchedProfileValue(
  field: FieldDescriptor,
  match: ProfileFieldMatch,
  profileValue: string | boolean
): ResolverDecision {
  if (isTextLikeControl(field)) {
    return {
      action: "fill",
      source: "profile",
      confidence: match.confidence,
      field,
      answer: textAnswer(profileValue),
      profileFieldKey: match.fieldKey,
      reason: `Matched profile alias "${match.matchedAlias}".`
    };
  }

  if (field.controlType === "checkbox" && typeof profileValue === "boolean") {
    return {
      action: "fill",
      source: "profile",
      confidence: match.confidence,
      field,
      answer: {
        answerType: "boolean",
        value: profileValue
      },
      profileFieldKey: match.fieldKey,
      reason: `Matched boolean profile alias "${match.matchedAlias}".`
    };
  }

  if (field.controlType === "select" || field.controlType === "radio") {
    if (hasAmbiguousOptions(field)) {
      return createPromptDecision(
        field,
        "ambiguous-option",
        "This option field has no scannable choices, so ask the user instead of guessing."
      );
    }

    const option =
      typeof profileValue === "boolean"
        ? findBooleanOption(field.options, profileValue)
        : findExactOption(field.options, profileValue);

    if (!option) {
      return createPromptDecision(
        field,
        "ambiguous-option",
        "The saved profile value did not exactly match a visible option."
      );
    }

    return {
      action: "fill",
      source: "profile",
      confidence: match.confidence,
      field,
      answer: {
        answerType: "option",
        value: optionAnswerValue(option)
      },
      profileFieldKey: match.fieldKey,
      reason: `Matched profile alias "${match.matchedAlias}" and exact option.`
    };
  }

  return createSkipDecision(
    field,
    "unsafe-control",
    "This control type is not safe to fill from profile data."
  );
}

function textAnswer(profileValue: string | boolean): PromptResponseValue {
  if (typeof profileValue === "boolean") {
    return {
      answerType: "text",
      value: profileValue ? "Yes" : "No"
    };
  }

  return {
    answerType: "text",
    value: profileValue
  };
}
