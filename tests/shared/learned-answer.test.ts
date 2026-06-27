import { describe, expect, it } from "vitest";

import {
  learnedAnswerControlTypeSchema,
  learnedAnswerSchema,
  learnedAnswerStateSchema,
  learnedAnswerValueSchema
} from "../../packages/shared/src/index.js";

describe("learnedAnswer unions", () => {
  it("accepts the supported control types", () => {
    expect(learnedAnswerControlTypeSchema.parse("text")).toBe("text");
    expect(learnedAnswerControlTypeSchema.parse("select")).toBe("select");
    expect(learnedAnswerControlTypeSchema.parse("checkbox")).toBe("checkbox");
  });

  it("accepts enabled and disabled states", () => {
    expect(learnedAnswerStateSchema.parse("enabled")).toBe("enabled");
    expect(learnedAnswerStateSchema.parse("disabled")).toBe("disabled");
  });

  it("rejects unsupported union values", () => {
    expect(learnedAnswerControlTypeSchema.safeParse("file").success).toBe(false);
    expect(learnedAnswerStateSchema.safeParse("archived").success).toBe(false);
  });
});

describe("learnedAnswerValueSchema", () => {
  it("accepts valid discriminated answer values", () => {
    expect(
      learnedAnswerValueSchema.parse({
        answerType: "text",
        value: "Authorized to work in the US"
      })
    ).toEqual({
      answerType: "text",
      value: "Authorized to work in the US"
    });

    expect(
      learnedAnswerValueSchema.parse({
        answerType: "boolean",
        value: true
      })
    ).toEqual({
      answerType: "boolean",
      value: true
    });
  });

  it("rejects impossible answerType and value combinations", () => {
    expect(
      learnedAnswerValueSchema.safeParse({
        answerType: "boolean",
        value: "yes"
      }).success
    ).toBe(false);

    expect(
      learnedAnswerValueSchema.safeParse({
        answerType: "text",
        value: false
      }).success
    ).toBe(false);
  });
});

describe("learnedAnswerSchema", () => {
  it("accepts a complete enabled learned answer", () => {
    const learnedAnswer = learnedAnswerSchema.parse({
      id: "memory_001",
      rawLabel: "  Are you legally authorized to work in the US?  ",
      normalizedLabel: "authorized work us",
      controlType: "radio",
      pageHost: "JOBS.EXAMPLE.COM",
      pagePathPattern: "  /apply/*  ",
      nearbyContext: "  employment eligibility  ",
      answerType: "boolean",
      value: true,
      state: "enabled",
      createdAt: "2026-06-27T10:00:00.000Z",
      updatedAt: "2026-06-27T10:05:00.000Z",
      lastUsedAt: "2026-06-27T10:10:00.000Z"
    });

    expect(learnedAnswer).toEqual({
      id: "memory_001",
      rawLabel: "Are you legally authorized to work in the US?",
      normalizedLabel: "authorized work us",
      controlType: "radio",
      pageHost: "jobs.example.com",
      pagePathPattern: "/apply/*",
      nearbyContext: "employment eligibility",
      answerType: "boolean",
      value: true,
      state: "enabled",
      createdAt: "2026-06-27T10:00:00.000Z",
      updatedAt: "2026-06-27T10:05:00.000Z",
      lastUsedAt: "2026-06-27T10:10:00.000Z"
    });
  });

  it("accepts a disabled learned answer without optional path, context, or last-used timestamp", () => {
    const learnedAnswer = learnedAnswerSchema.parse({
      id: "memory_002",
      rawLabel: "LinkedIn Profile",
      normalizedLabel: "linkedin profile",
      controlType: "text",
      pageHost: "company.example.com",
      answerType: "option",
      value: "https://www.linkedin.com/in/ada-lovelace",
      state: "disabled",
      createdAt: "2026-06-27T10:00:00.000Z",
      updatedAt: "2026-06-27T10:05:00.000Z"
    });

    expect(learnedAnswer.pagePathPattern).toBeUndefined();
    expect(learnedAnswer.nearbyContext).toBeUndefined();
    expect(learnedAnswer.lastUsedAt).toBeUndefined();
  });

  it("rejects missing required metadata", () => {
    const parsed = learnedAnswerSchema.safeParse({
      rawLabel: "LinkedIn Profile",
      normalizedLabel: "linkedin profile",
      controlType: "text",
      pageHost: "company.example.com",
      answerType: "text",
      value: "https://www.linkedin.com/in/ada-lovelace",
      state: "enabled",
      createdAt: "2026-06-27T10:00:00.000Z",
      updatedAt: "2026-06-27T10:05:00.000Z"
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid timestamps and impossible value shapes", () => {
    expect(
      learnedAnswerSchema.safeParse({
        id: "memory_003",
        rawLabel: "Portfolio",
        normalizedLabel: "portfolio",
        controlType: "text",
        pageHost: "company.example.com",
        answerType: "text",
        value: true,
        state: "enabled",
        createdAt: "yesterday",
        updatedAt: "2026-06-27T10:05:00.000Z"
      }).success
    ).toBe(false);
  });
});
