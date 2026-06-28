import { describe, expect, it } from "vitest";

import {
  resolveField,
  resolveFromLearnedAnswers,
  resolveFromProfile,
  type FieldDescriptor
} from "../../apps/server/src/resolvers/index.js";
import {
  ambiguousApplicationFields,
  commonApplicationFields
} from "../fixtures/resolvers/field-fixtures.js";
import type { ApplicantProfile, LearnedAnswer } from "../../packages/shared/src/index.js";

const profile: ApplicantProfile = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  phone: "555-0100",
  location: "San Francisco, CA",
  linkedinUrl: "https://www.linkedin.com/in/ada",
  portfolioUrl: "https://ada.example.com",
  workAuthorization: "Yes",
  sponsorshipRequired: false,
  defaultResumePath: "/Users/example/resume.pdf"
};

describe("resolveFromProfile", () => {
  it("fills common text fields through shared aliases", () => {
    const decision = resolveFromProfile({
      field: commonApplicationFields.email,
      profile
    });

    expect(decision).toMatchObject({
      action: "fill",
      source: "profile",
      confidence: 1,
      answer: {
        answerType: "text",
        value: "ada@example.com"
      },
      profileFieldKey: "email"
    });
  });

  it("splits a saved full name into first and last name when labels are explicit", () => {
    const firstNameDecision = resolveFromProfile({
      field: commonApplicationFields.firstName,
      profile
    });
    const lastNameDecision = resolveFromProfile({
      field: {
        ...commonApplicationFields.firstName,
        label: "Last name"
      },
      profile
    });

    expect(firstNameDecision).toMatchObject({
      action: "fill",
      answer: {
        answerType: "text",
        value: "Ada"
      },
      profileFieldKey: "firstName"
    });
    expect(lastNameDecision).toMatchObject({
      action: "fill",
      answer: {
        answerType: "text",
        value: "Lovelace"
      },
      profileFieldKey: "lastName"
    });
  });

  it("prompts when split-name data is not available", () => {
    const decision = resolveFromProfile({
      field: {
        ...commonApplicationFields.firstName,
        label: "Last name"
      },
      profile: {
        ...profile,
        fullName: "Ada"
      }
    });

    expect(decision).toMatchObject({
      action: "prompt",
      reason: "missing-profile-value"
    });
  });

  it("fills radio options only when the profile value exactly matches a visible option", () => {
    const decision = resolveFromProfile({
      field: commonApplicationFields.sponsorship,
      profile
    });

    expect(decision).toMatchObject({
      action: "fill",
      source: "profile",
      answer: {
        answerType: "option",
        value: "no"
      },
      profileFieldKey: "sponsorshipRequired"
    });
  });

  it("prompts when an option field has no scannable choices", () => {
    const decision = resolveFromProfile({
      field: ambiguousApplicationFields.radioWithoutOptions,
      profile
    });

    expect(decision).toMatchObject({
      action: "prompt",
      reason: "ambiguous-option"
    });
  });

  it("does not fill weak or unrelated labels from profile aliases", () => {
    const decision = resolveFromProfile({
      field: ambiguousApplicationFields.unclearSelect,
      profile
    });

    expect(decision).toBeUndefined();
  });
});

describe("resolveFromLearnedAnswers", () => {
  it("reuses enabled learned answers for strong label, control, host, and path matches", () => {
    const decision = resolveFromLearnedAnswers({
      field: {
        label: "How did you hear about us?",
        controlType: "select",
        pageHost: "jobs.example.com",
        pagePath: "/apply",
        options: [{ label: "LinkedIn" }, { label: "Referral" }]
      },
      learnedAnswers: [
        makeLearnedAnswer({
          normalizedLabel: "how did you hear about us",
          controlType: "select",
          answerType: "option",
          value: "LinkedIn",
          pageHost: "jobs.example.com",
          pagePathPattern: "/apply"
        })
      ]
    });

    expect(decision).toMatchObject({
      action: "fill",
      source: "learned-answer",
      learnedAnswerId: "answer-1",
      answer: {
        answerType: "option",
        value: "LinkedIn"
      }
    });
  });

  it("excludes disabled learned answers from automatic reuse", () => {
    const decision = resolveFromLearnedAnswers({
      field: learnedTextField(),
      learnedAnswers: [
        makeLearnedAnswer({
          state: "disabled"
        })
      ]
    });

    expect(decision).toBeUndefined();
  });

  it("does not reuse learned answers across host and context mismatches", () => {
    const decision = resolveFromLearnedAnswers({
      field: {
        ...learnedTextField(),
        pageHost: "different.example.com",
        nearbyContext: "Unrelated profile details"
      },
      learnedAnswers: [
        makeLearnedAnswer({
          pageHost: "jobs.example.com",
          nearbyContext: "Application questions"
        })
      ]
    });

    expect(decision).toBeUndefined();
  });

  it("allows strong nearby context to match when the host or path changed", () => {
    const decision = resolveFromLearnedAnswers({
      field: {
        ...learnedTextField(),
        pageHost: "greenhouse.example.com",
        pagePath: "/job/123",
        nearbyContext: "Application questions"
      },
      learnedAnswers: [
        makeLearnedAnswer({
          pageHost: "jobs.example.com",
          pagePathPattern: "/old-apply",
          nearbyContext: "Application questions"
        })
      ]
    });

    expect(decision).toMatchObject({
      action: "fill",
      source: "learned-answer"
    });
  });

  it("prompts when a learned option answer does not match visible options", () => {
    const decision = resolveFromLearnedAnswers({
      field: {
        label: "How did you hear about us?",
        controlType: "select",
        pageHost: "jobs.example.com",
        pagePath: "/apply",
        options: [{ label: "Referral" }]
      },
      learnedAnswers: [
        makeLearnedAnswer({
          normalizedLabel: "how did you hear about us",
          controlType: "select",
          answerType: "option",
          value: "LinkedIn"
        })
      ]
    });

    expect(decision).toMatchObject({
      action: "prompt",
      reason: "ambiguous-option"
    });
  });
});

describe("resolveField", () => {
  it("prefers profile data over learned answers", () => {
    const decision = resolveField({
      field: commonApplicationFields.email,
      profile,
      learnedAnswers: [
        makeLearnedAnswer({
          rawLabel: "Email address",
          normalizedLabel: "email address",
          answerType: "text",
          value: "other@example.com"
        })
      ]
    });

    expect(decision).toMatchObject({
      action: "fill",
      source: "profile",
      answer: {
        value: "ada@example.com"
      }
    });
  });

  it("prompts for low-confidence unknown fields", () => {
    const decision = resolveField({
      field: {
        label: "Favorite database",
        controlType: "text",
        pageHost: "jobs.example.com",
        pagePath: "/apply"
      },
      profile,
      learnedAnswers: []
    });

    expect(decision).toMatchObject({
      action: "prompt",
      reason: "low-confidence"
    });
  });

  it("prompts for open-ended questions without generating an answer", () => {
    const decision = resolveField({
      field: ambiguousApplicationFields.openEnded,
      profile,
      learnedAnswers: [
        makeLearnedAnswer({
          rawLabel: "Why are you interested in this role?",
          normalizedLabel: "why are you interested in this role",
          controlType: "textarea",
          answerType: "text",
          value: "Saved manually"
        })
      ]
    });

    expect(decision).toMatchObject({
      action: "prompt",
      reason: "open-ended-question"
    });
  });

  it("prompts for ambiguous radio and select fields instead of guessing", () => {
    const radioDecision = resolveField({
      field: ambiguousApplicationFields.radioWithoutOptions,
      profile,
      learnedAnswers: []
    });
    const selectDecision = resolveField({
      field: ambiguousApplicationFields.unclearSelect,
      profile,
      learnedAnswers: []
    });

    expect(radioDecision).toMatchObject({
      action: "prompt",
      reason: "ambiguous-option"
    });
    expect(selectDecision).toMatchObject({
      action: "prompt",
      reason: "low-confidence"
    });
  });
});

function learnedTextField(): FieldDescriptor {
  return {
    label: "What is your preferred work style?",
    controlType: "text",
    pageHost: "jobs.example.com",
    pagePath: "/apply",
    nearbyContext: "Application questions"
  };
}

function makeLearnedAnswer(
  overrides: Partial<LearnedAnswer> = {}
): LearnedAnswer {
  return {
    id: "answer-1",
    rawLabel: "What is your preferred work style?",
    normalizedLabel: "what is your preferred work style",
    controlType: "text",
    pageHost: "jobs.example.com",
    pagePathPattern: "/apply",
    nearbyContext: "Application questions",
    answerType: "text",
    value: "Remote",
    state: "enabled",
    createdAt: "2026-06-28T00:00:00.000Z",
    updatedAt: "2026-06-28T00:00:00.000Z",
    ...overrides
  } as LearnedAnswer;
}
