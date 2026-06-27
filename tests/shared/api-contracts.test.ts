import { describe, expect, it } from "vitest";

import {
  createRunRequestSchema,
  createRunResponseSchema,
  getProfileResponseSchema,
  getRunResponseSchema,
  listMemoryResponseSchema,
  respondToPromptRequestSchema,
  respondToPromptResponseSchema,
  updateLearnedAnswerRequestSchema,
  updateProfileRequestSchema
} from "../../packages/shared/src/index.js";

describe("run API contracts", () => {
  it("accepts a create-run request and response", () => {
    expect(
      createRunRequestSchema.parse({
        jobUrl: "  https://jobs.example.com/apply/123  "
      })
    ).toEqual({
      jobUrl: "https://jobs.example.com/apply/123"
    });

    expect(
      createRunResponseSchema.parse({
        run: {
          id: "run_001",
          jobUrl: "https://jobs.example.com/apply/123",
          status: "pending",
          createdAt: "2026-06-27T10:00:00.000Z",
          updatedAt: "2026-06-27T10:00:00.000Z"
        }
      }).run.status
    ).toBe("pending");
  });

  it("accepts a run-detail response with steps and an optional current prompt", () => {
    const response = getRunResponseSchema.parse({
      run: {
        id: "run_001",
        jobUrl: "https://jobs.example.com/apply/123",
        status: "prompting",
        createdAt: "2026-06-27T10:00:00.000Z",
        updatedAt: "2026-06-27T10:01:00.000Z",
        currentPromptId: "prompt_001"
      },
      currentPrompt: {
        id: "prompt_001",
        runId: "run_001",
        status: "open",
        fieldLabel: "Work authorization",
        normalizedFieldLabel: "work authorization",
        controlType: "radio",
        pageHost: "jobs.example.com",
        message: "Please confirm your work authorization.",
        createdAt: "2026-06-27T10:01:00.000Z"
      },
      steps: [
        {
          id: "step_001",
          runId: "run_001",
          status: "prompting",
          level: "warning",
          message: "Paused for user input.",
          promptId: "prompt_001",
          createdAt: "2026-06-27T10:01:00.000Z"
        }
      ]
    });

    expect(response.currentPrompt?.id).toBe("prompt_001");
    expect(response.steps).toHaveLength(1);
  });
});

describe("profile API contracts", () => {
  it("accepts a missing saved profile response", () => {
    expect(
      getProfileResponseSchema.parse({
        profile: null
      })
    ).toEqual({
      profile: null
    });
  });

  it("uses the shared applicant profile schema for profile updates", () => {
    expect(
      updateProfileRequestSchema.parse({
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "+1 555 0100",
        location: "New York, NY",
        workAuthorization: "US citizen",
        sponsorshipRequired: false
      }).email
    ).toBe("ada@example.com");
  });
});

describe("memory API contracts", () => {
  it("accepts a memory-list response", () => {
    expect(
      listMemoryResponseSchema.parse({
        items: [
          {
            id: "memory_001",
            rawLabel: "LinkedIn Profile",
            normalizedLabel: "linkedin profile",
            controlType: "text",
            pageHost: "company.example.com",
            answerType: "text",
            value: "https://www.linkedin.com/in/ada-lovelace",
            state: "enabled",
            createdAt: "2026-06-27T10:00:00.000Z",
            updatedAt: "2026-06-27T10:01:00.000Z"
          }
        ]
      }).items
    ).toHaveLength(1);
  });

  it("accepts a learned-answer patch with cleared optional context", () => {
    expect(
      updateLearnedAnswerRequestSchema.parse({
        nearbyContext: null,
        state: "disabled"
      })
    ).toEqual({
      nearbyContext: null,
      state: "disabled"
    });
  });

  it("rejects an empty learned-answer patch", () => {
    expect(updateLearnedAnswerRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe("prompt response API contracts", () => {
  it("accepts a prompt-response request and response", () => {
    expect(
      respondToPromptRequestSchema.parse({
        response: {
          action: "answer",
          saveForReuse: true,
          answerType: "boolean",
          value: false
        }
      }).response.action
    ).toBe("answer");

    expect(
      respondToPromptResponseSchema.parse({
        run: {
          id: "run_001",
          jobUrl: "https://jobs.example.com/apply/123",
          status: "filling",
          createdAt: "2026-06-27T10:00:00.000Z",
          updatedAt: "2026-06-27T10:02:00.000Z",
          currentPromptId: "prompt_001"
        },
        prompt: {
          id: "prompt_001",
          runId: "run_001",
          status: "answered",
          fieldLabel: "Work authorization",
          normalizedFieldLabel: "work authorization",
          controlType: "radio",
          pageHost: "jobs.example.com",
          message: "Please confirm your work authorization.",
          response: {
            action: "answer",
            saveForReuse: true,
            answerType: "boolean",
            value: false
          },
          createdAt: "2026-06-27T10:01:00.000Z",
          answeredAt: "2026-06-27T10:02:00.000Z"
        }
      }).prompt.status
    ).toBe("answered");
  });

  it("rejects malformed transport payloads", () => {
    expect(
      createRunRequestSchema.safeParse({
        jobUrl: "not-a-url"
      }).success
    ).toBe(false);

    expect(
      respondToPromptRequestSchema.safeParse({
        response: {
          action: "skip",
          saveForReuse: true
        }
      }).success
    ).toBe(false);
  });
});
