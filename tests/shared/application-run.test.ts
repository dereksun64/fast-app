import { describe, expect, it } from "vitest";

import {
  applicationRunSchema,
  promptResponseSchema,
  promptSchema,
  runEventSchema,
  runEventSchemaVersion,
  runStatusSchema,
  runStepSchema
} from "../../packages/shared/src/index.js";

describe("runStatusSchema", () => {
  it("accepts the planned lifecycle states", () => {
    expect(runStatusSchema.parse("pending")).toBe("pending");
    expect(runStatusSchema.parse("prompting")).toBe("prompting");
    expect(runStatusSchema.parse("waitingForReview")).toBe("waitingForReview");
    expect(runStatusSchema.parse("completed")).toBe("completed");
  });

  it("rejects unsupported run states", () => {
    expect(runStatusSchema.safeParse("paused").success).toBe(false);
  });
});

describe("promptResponseSchema", () => {
  it("accepts answered prompt responses with typed values", () => {
    expect(
      promptResponseSchema.parse({
        action: "answer",
        saveForReuse: true,
        answerType: "text",
        value: "Ada Lovelace"
      })
    ).toEqual({
      action: "answer",
      saveForReuse: true,
      answerType: "text",
      value: "Ada Lovelace"
    });
  });

  it("accepts skip responses only when reuse is false", () => {
    expect(
      promptResponseSchema.parse({
        action: "skip",
        saveForReuse: false
      })
    ).toEqual({
      action: "skip",
      saveForReuse: false
    });
  });

  it("rejects impossible prompt response combinations", () => {
    expect(
      promptResponseSchema.safeParse({
        action: "skip",
        saveForReuse: true
      }).success
    ).toBe(false);

    expect(
      promptResponseSchema.safeParse({
        action: "answer",
        saveForReuse: false,
        answerType: "boolean",
        value: "yes"
      }).success
    ).toBe(false);
  });
});

describe("promptSchema", () => {
  it("accepts an open prompt without a response yet", () => {
    const prompt = promptSchema.parse({
      id: "prompt_001",
      runId: "run_001",
      status: "open",
      fieldLabel: "Work authorization",
      normalizedFieldLabel: "work authorization",
      controlType: "radio",
      pageHost: "JOBS.EXAMPLE.COM",
      pagePath: "  /apply/123  ",
      nearbyContext: "  employment eligibility  ",
      message: "Please confirm your work authorization.",
      createdAt: "2026-06-27T10:00:00.000Z"
    });

    expect(prompt.pageHost).toBe("jobs.example.com");
    expect(prompt.pagePath).toBe("/apply/123");
    expect(prompt.nearbyContext).toBe("employment eligibility");
    expect(prompt.response).toBeUndefined();
  });

  it("accepts an answered prompt with a structured response", () => {
    const prompt = promptSchema.parse({
      id: "prompt_002",
      runId: "run_001",
      status: "answered",
      fieldLabel: "LinkedIn Profile",
      normalizedFieldLabel: "linkedin profile",
      controlType: "text",
      pageHost: "company.example.com",
      message: "Please provide your LinkedIn profile URL.",
      response: {
        action: "answer",
        saveForReuse: true,
        answerType: "text",
        value: "https://www.linkedin.com/in/ada-lovelace"
      },
      createdAt: "2026-06-27T10:00:00.000Z",
      answeredAt: "2026-06-27T10:01:00.000Z"
    });

    expect(prompt.response?.action).toBe("answer");
  });
});

describe("runStepSchema", () => {
  it("accepts an observable run step", () => {
    const step = runStepSchema.parse({
      id: "step_001",
      runId: "run_001",
      status: "scanning",
      level: "info",
      message: "Scanning visible form controls.",
      pageUrl: "https://jobs.example.com/apply/123",
      createdAt: "2026-06-27T10:00:00.000Z"
    });

    expect(step.message).toBe("Scanning visible form controls.");
  });
});

describe("applicationRunSchema", () => {
  it("accepts a run in progress with a latest step summary", () => {
    const run = applicationRunSchema.parse({
      id: "run_001",
      jobUrl: "https://jobs.example.com/apply/123",
      status: "prompting",
      createdAt: "2026-06-27T10:00:00.000Z",
      updatedAt: "2026-06-27T10:01:00.000Z",
      startedAt: "2026-06-27T10:00:10.000Z",
      currentPromptId: "prompt_001",
      latestStep: {
        id: "step_002",
        runId: "run_001",
        status: "prompting",
        level: "warning",
        message: "Paused for user input on an uncertain field.",
        promptId: "prompt_001",
        createdAt: "2026-06-27T10:01:00.000Z"
      }
    });

    expect(run.status).toBe("prompting");
    expect(run.currentPromptId).toBe("prompt_001");
  });

  it("rejects invalid run payloads", () => {
    expect(
      applicationRunSchema.safeParse({
        id: "run_002",
        jobUrl: "not-a-url",
        status: "running",
        createdAt: "2026-06-27T10:00:00.000Z",
        updatedAt: "2026-06-27T10:01:00.000Z"
      }).success
    ).toBe(false);
  });
});

describe("runEventSchema", () => {
  it("accepts status, step, prompt, and error events", () => {
    expect(
      runEventSchema.parse({
        schemaVersion: runEventSchemaVersion,
        eventType: "runStatusChanged",
        runId: "run_001",
        status: "waitingForReview",
        at: "2026-06-27T10:02:00.000Z"
      }).eventType
    ).toBe("runStatusChanged");

    expect(
      runEventSchema.parse({
        schemaVersion: runEventSchemaVersion,
        eventType: "runError",
        runId: "run_001",
        message: "Could not find a clear next action.",
        at: "2026-06-27T10:03:00.000Z"
      }).eventType
    ).toBe("runError");
  });

  it("rejects malformed event payloads", () => {
    expect(
      runEventSchema.safeParse({
        schemaVersion: 99,
        eventType: "runStatusChanged",
        runId: "run_001",
        status: "waitingForReview",
        at: "2026-06-27T10:02:00.000Z"
      }).success
    ).toBe(false);

    expect(
      runEventSchema.safeParse({
        schemaVersion: runEventSchemaVersion,
        eventType: "promptCreated",
        runId: "run_001",
        at: "2026-06-27T10:02:00.000Z"
      }).success
    ).toBe(false);
  });
});
