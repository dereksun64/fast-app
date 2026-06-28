import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { applyMigrations } from "../../apps/server/src/db/migrations.js";
import { appMigrations } from "../../apps/server/src/db/migrations/index.js";
import {
  openSqliteDatabase,
  type SqliteDatabase
} from "../../apps/server/src/db/sqlite.js";
import { createRunRepository } from "../../apps/server/src/runner/run-repository.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const temporaryDirectory of temporaryDirectories.splice(0)) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

describe("createRunRepository", () => {
  it("creates runs and records lifecycle timestamps", () => {
    const database = openMigratedTemporaryDatabase();
    const repository = createRunRepository(database, {
      now: createClock([
        "2026-06-28T00:00:00.000Z",
        "2026-06-28T00:01:00.000Z",
        "2026-06-28T00:05:00.000Z"
      ]),
      createId: createIds(["run-1"])
    });

    const run = repository.createRun(" https://example.com/jobs/1 ");
    const startingRun = repository.updateRunStatus(run.id, "starting");
    const completedRun = repository.updateRunStatus(run.id, "completed");

    expect(run).toMatchObject({
      id: "run-1",
      jobUrl: "https://example.com/jobs/1",
      status: "pending",
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:00:00.000Z"
    });
    expect(startingRun).toMatchObject({
      status: "starting",
      startedAt: "2026-06-28T00:01:00.000Z"
    });
    expect(completedRun).toMatchObject({
      status: "completed",
      startedAt: "2026-06-28T00:01:00.000Z",
      completedAt: "2026-06-28T00:05:00.000Z"
    });

    database.close();
  });

  it("persists prompts, current prompt tracking, and prompt answers", () => {
    const database = openMigratedTemporaryDatabase();
    const repository = createRunRepository(database, {
      now: createClock([
        "2026-06-28T00:00:00.000Z",
        "2026-06-28T00:01:00.000Z",
        "2026-06-28T00:02:00.000Z",
        "2026-06-28T00:03:00.000Z"
      ]),
      createId: createIds(["run-1", "prompt-1"])
    });

    const run = repository.createRun("https://example.com/jobs/1");
    const prompt = repository.createPrompt({
      runId: run.id,
      fieldLabel: "Expected salary",
      normalizedFieldLabel: "expected salary",
      controlType: "text",
      pageHost: "EXAMPLE.com",
      pagePath: "/jobs/1",
      nearbyContext: "Compensation",
      message: "Please answer this field."
    });
    const runWithPrompt = repository.setCurrentPrompt(run.id, prompt.id);
    const answeredPrompt = repository.answerPrompt(prompt.id, {
      action: "answer",
      answerType: "text",
      value: "100000",
      saveForReuse: true
    });

    expect(prompt).toMatchObject({
      id: "prompt-1",
      runId: "run-1",
      status: "open",
      pageHost: "example.com"
    });
    expect(runWithPrompt?.currentPromptId).toBe("prompt-1");
    expect(repository.getCurrentPrompt(run.id)).toEqual(answeredPrompt);
    expect(answeredPrompt).toMatchObject({
      status: "answered",
      answeredAt: "2026-06-28T00:03:00.000Z",
      response: {
        action: "answer",
        answerType: "text",
        value: "100000",
        saveForReuse: true
      }
    });

    database.close();
  });

  it("appends run steps and exposes the latest step on the run", () => {
    const database = openMigratedTemporaryDatabase();
    const repository = createRunRepository(database, {
      now: createClock([
        "2026-06-28T00:00:00.000Z",
        "2026-06-28T00:01:00.000Z",
        "2026-06-28T00:02:00.000Z"
      ]),
      createId: createIds(["run-1", "step-1", "step-2"])
    });

    const run = repository.createRun("https://example.com/jobs/1");
    repository.appendRunStep({
      runId: run.id,
      status: "scanning",
      level: "info",
      message: "Scanning page.",
      pageUrl: "https://example.com/jobs/1"
    });
    const latestStep = repository.appendRunStep({
      runId: run.id,
      status: "prompting",
      level: "warning",
      message: "Prompt required.",
      fieldLabel: "Expected salary"
    });

    expect(repository.listRunSteps(run.id)).toHaveLength(2);
    expect(repository.getRun(run.id)?.latestStep).toEqual(latestStep);

    database.close();
  });

  it("persists screenshot metadata without screenshot content", () => {
    const database = openMigratedTemporaryDatabase();
    const repository = createRunRepository(database, {
      now: createClock([
        "2026-06-28T00:00:00.000Z",
        "2026-06-28T00:01:00.000Z",
        "2026-06-28T00:02:00.000Z"
      ]),
      createId: createIds(["run-1", "step-1", "screenshot-1"])
    });

    const run = repository.createRun("https://example.com/jobs/1");
    const step = repository.appendRunStep({
      runId: run.id,
      status: "failed",
      level: "error",
      message: "Unable to resolve field."
    });
    const screenshot = repository.createScreenshotMetadata({
      runId: run.id,
      stepId: step.id,
      filePath: "data/screenshots/run-1-step-1.png",
      pageUrl: "https://example.com/jobs/1",
      reason: "failure"
    });

    expect(screenshot).toEqual({
      id: "screenshot-1",
      runId: "run-1",
      stepId: "step-1",
      filePath: "data/screenshots/run-1-step-1.png",
      pageUrl: "https://example.com/jobs/1",
      reason: "failure",
      createdAt: "2026-06-28T00:02:00.000Z"
    });
    expect(repository.listScreenshotMetadata(run.id)).toEqual([screenshot]);

    database.close();
  });

  it("returns undefined for missing run and prompt updates", () => {
    const database = openMigratedTemporaryDatabase();
    const repository = createRunRepository(database);

    expect(repository.getRun("missing")).toBeUndefined();
    expect(repository.updateRunStatus("missing", "failed")).toBeUndefined();
    expect(repository.setCurrentPrompt("missing", undefined)).toBeUndefined();
    expect(repository.getPrompt("missing")).toBeUndefined();
    expect(
      repository.answerPrompt("missing", {
        action: "skip",
        saveForReuse: false
      })
    ).toBeUndefined();

    database.close();
  });

  it("rejects invalid persisted prompt responses when reading", () => {
    const database = openMigratedTemporaryDatabase();
    const repository = createRunRepository(database, {
      now: () => "2026-06-28T00:00:00.000Z",
      createId: createIds(["run-1"])
    });
    const run = repository.createRun("https://example.com/jobs/1");

    database
      .prepare(
        `INSERT INTO prompts (
          id,
          run_id,
          status,
          field_label,
          normalized_field_label,
          control_type,
          page_host,
          message,
          response_json,
          created_at,
          answered_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        "prompt-1",
        run.id,
        "answered",
        "Question",
        "question",
        "text",
        "example.com",
        "Please answer.",
        JSON.stringify({ action: "answer", saveForReuse: true }),
        "2026-06-28T00:01:00.000Z",
        "2026-06-28T00:02:00.000Z"
      );

    expect(() => repository.getPrompt("prompt-1")).toThrow();

    database.close();
  });
});

function openMigratedTemporaryDatabase(): SqliteDatabase {
  const temporaryDirectory = mkdtempSync(
    path.join(os.tmpdir(), "fast-app-runs-")
  );
  temporaryDirectories.push(temporaryDirectory);

  const database = openSqliteDatabase({
    databasePath: path.join(temporaryDirectory, "app.db")
  });
  applyMigrations(database, appMigrations);

  return database;
}

function createClock(timestamps: string[]): () => string {
  return () => {
    const timestamp = timestamps.shift();

    if (!timestamp) {
      throw new Error("Unexpected timestamp request.");
    }

    return timestamp;
  };
}

function createIds(ids: string[]): () => string {
  return () => {
    const id = ids.shift();

    if (!id) {
      throw new Error("Unexpected id request.");
    }

    return id;
  };
}
