import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createServerApp } from "../../apps/server/src/app.js";
import { loadServerRuntimePaths } from "../../apps/server/src/config/runtime-paths.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const temporaryDirectory of temporaryDirectories.splice(0)) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

describe("memory routes", () => {
  it("lists learned answers", async () => {
    const server = await createTemporaryServer({
      ids: ["memory-1"],
      timestamps: [
        "2026-06-28T00:00:00.000Z",
        "2026-06-28T00:00:00.000Z",
        "2026-06-28T00:01:00.000Z"
      ]
    });
    const learnedAnswer =
      server.context.memoryRepository.createLearnedAnswer(makeLearnedAnswerInput());

    const response = await server.app.inject({
      method: "GET",
      url: "/memory"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      items: [learnedAnswer]
    });

    await server.close();
  });

  it("patches learned-answer fields and supports soft disabling", async () => {
    const server = await createTemporaryServer({
      ids: ["memory-1"],
      timestamps: [
        "2026-06-28T00:00:00.000Z",
        "2026-06-28T00:00:00.000Z",
        "2026-06-28T00:01:00.000Z"
      ]
    });
    const learnedAnswer =
      server.context.memoryRepository.createLearnedAnswer(makeLearnedAnswerInput());

    const response = await server.app.inject({
      method: "PATCH",
      url: `/memory/${learnedAnswer.id}`,
      payload: {
        nearbyContext: null,
        state: "disabled",
        answer: {
          answerType: "text",
          value: "Updated answer"
        }
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      item: {
        id: learnedAnswer.id,
        state: "disabled",
        answerType: "text",
        value: "Updated answer",
        updatedAt: "2026-06-28T00:01:00.000Z"
      }
    });

    await server.close();
  });

  it("rejects empty patch payloads with a structured error", async () => {
    const server = await createTemporaryServer();

    const response = await server.app.inject({
      method: "PATCH",
      url: "/memory/memory-1",
      payload: {}
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid learned-answer payload."
      }
    });

    await server.close();
  });

  it("returns a structured error for missing learned answers", async () => {
    const server = await createTemporaryServer();

    const response = await server.app.inject({
      method: "PATCH",
      url: "/memory/missing",
      payload: {
        state: "disabled"
      }
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Learned answer not found."
      }
    });

    await server.close();
  });
});

interface TemporaryServerOptions {
  readonly ids?: string[];
  readonly timestamps?: string[];
}

async function createTemporaryServer(options: TemporaryServerOptions = {}) {
  return createServerApp({
    runtimePaths: createTemporaryRuntimePaths(),
    createId: createIds(options.ids ?? []),
    now: createClock(options.timestamps ?? [])
  });
}

function createTemporaryRuntimePaths() {
  const temporaryDirectory = mkdtempSync(
    path.join(os.tmpdir(), "fast-app-memory-routes-")
  );
  temporaryDirectories.push(temporaryDirectory);

  return loadServerRuntimePaths({
    FAST_APP_PROJECT_ROOT: temporaryDirectory,
    FAST_APP_DATABASE_PATH: "data/app.db",
    FAST_APP_BROWSER_PROFILE_PATH: "data/browser-profile",
    FAST_APP_LOGS_PATH: "data/logs",
    FAST_APP_SCREENSHOTS_PATH: "data/screenshots",
    FAST_APP_ALLOWED_RESUME_PATHS: "data/resumes"
  });
}

function makeLearnedAnswerInput() {
  return {
    rawLabel: "Work authorization",
    normalizedLabel: "work authorization",
    controlType: "radio" as const,
    pageHost: "jobs.example.com",
    pagePathPattern: "/apply",
    nearbyContext: "Eligibility",
    answer: {
      answerType: "boolean" as const,
      value: true
    }
  };
}

function createClock(timestamps: string[]): () => string {
  return () => timestamps.shift() ?? new Date().toISOString();
}

function createIds(ids: string[]): () => string {
  return () => ids.shift() ?? crypto.randomUUID();
}
