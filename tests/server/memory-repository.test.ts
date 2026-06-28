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
import {
  createMemoryRepository,
  type CreateLearnedAnswerInput
} from "../../apps/server/src/memory/memory-repository.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const temporaryDirectory of temporaryDirectories.splice(0)) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

describe("createMemoryRepository", () => {
  it("creates and lists learned answers validated against the shared schema", () => {
    const database = openMigratedTemporaryDatabase();
    const repository = createMemoryRepository(database, {
      now: () => "2026-06-28T00:00:00.000Z",
      createId: () => "answer-1"
    });

    const created = repository.createLearnedAnswer(makeLearnedAnswerInput());

    expect(created).toEqual({
      id: "answer-1",
      rawLabel: "Are you authorized to work in the United States?",
      normalizedLabel: "authorized to work in united states",
      controlType: "radio",
      pageHost: "example.com",
      pagePathPattern: "/jobs/*",
      nearbyContext: "Eligibility",
      answerType: "option",
      value: "Yes",
      state: "enabled",
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:00:00.000Z"
    });
    expect(repository.listLearnedAnswers()).toEqual([created]);

    database.close();
  });

  it("updates editable fields and clears nullable context fields", () => {
    const database = openMigratedTemporaryDatabase();
    const timestamps = [
      "2026-06-28T00:00:00.000Z",
      "2026-06-28T00:05:00.000Z"
    ];
    const repository = createMemoryRepository(database, {
      now: () => timestamps.shift() ?? "2026-06-28T00:10:00.000Z",
      createId: () => "answer-1"
    });

    repository.createLearnedAnswer(makeLearnedAnswerInput());
    const updated = repository.updateLearnedAnswer("answer-1", {
      rawLabel: "Work authorization",
      normalizedLabel: "work authorization",
      pagePathPattern: null,
      nearbyContext: null,
      answer: {
        answerType: "text",
        value: "Authorized"
      }
    });

    expect(updated).toMatchObject({
      id: "answer-1",
      rawLabel: "Work authorization",
      normalizedLabel: "work authorization",
      pagePathPattern: undefined,
      nearbyContext: undefined,
      answerType: "text",
      value: "Authorized",
      state: "enabled",
      createdAt: "2026-06-28T00:00:00.000Z",
      updatedAt: "2026-06-28T00:05:00.000Z"
    });
    expect(repository.listLearnedAnswers()).toEqual([updated]);

    database.close();
  });

  it("soft disables learned answers instead of deleting them", () => {
    const database = openMigratedTemporaryDatabase();
    const repository = createMemoryRepository(database, {
      now: () => "2026-06-28T00:00:00.000Z",
      createId: () => "answer-1"
    });

    repository.createLearnedAnswer(makeLearnedAnswerInput());
    const disabled = repository.disableLearnedAnswer("answer-1");

    expect(disabled?.state).toBe("disabled");
    expect(repository.listLearnedAnswers()).toHaveLength(1);
    expect(repository.listLearnedAnswers()[0]?.state).toBe("disabled");

    database.close();
  });

  it("updates last-used timestamp for reuse observability", () => {
    const database = openMigratedTemporaryDatabase();
    const timestamps = [
      "2026-06-28T00:00:00.000Z",
      "2026-06-28T00:07:00.000Z"
    ];
    const repository = createMemoryRepository(database, {
      now: () => timestamps.shift() ?? "2026-06-28T00:10:00.000Z",
      createId: () => "answer-1"
    });

    repository.createLearnedAnswer(makeLearnedAnswerInput());
    const used = repository.markLearnedAnswerUsed("answer-1");

    expect(used?.lastUsedAt).toBe("2026-06-28T00:07:00.000Z");
    expect(used?.updatedAt).toBe("2026-06-28T00:07:00.000Z");

    database.close();
  });

  it("returns undefined when updating unknown learned answers", () => {
    const database = openMigratedTemporaryDatabase();
    const repository = createMemoryRepository(database);

    expect(
      repository.updateLearnedAnswer("missing", { state: "disabled" })
    ).toBeUndefined();
    expect(repository.disableLearnedAnswer("missing")).toBeUndefined();
    expect(repository.markLearnedAnswerUsed("missing")).toBeUndefined();

    database.close();
  });

  it("rejects invalid incoming learned answers", () => {
    const database = openMigratedTemporaryDatabase();
    const repository = createMemoryRepository(database, {
      createId: () => "answer-1"
    });

    expect(() => {
      repository.createLearnedAnswer({
        ...makeLearnedAnswerInput(),
        pageHost: ""
      });
    }).toThrow();

    database.close();
  });

  it("rejects invalid persisted answer values when reading", () => {
    const database = openMigratedTemporaryDatabase();
    database
      .prepare(
        `INSERT INTO learned_answers (
          id,
          raw_label,
          normalized_label,
          control_type,
          page_host,
          answer_type,
          answer_value_json,
          state,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        "answer-1",
        "Subscribe?",
        "subscribe",
        "checkbox",
        "example.com",
        "boolean",
        JSON.stringify("not-a-boolean"),
        "enabled",
        "2026-06-28T00:00:00.000Z",
        "2026-06-28T00:00:00.000Z"
      );
    const repository = createMemoryRepository(database);

    expect(() => repository.listLearnedAnswers()).toThrow();

    database.close();
  });
});

function openMigratedTemporaryDatabase(): SqliteDatabase {
  const temporaryDirectory = mkdtempSync(
    path.join(os.tmpdir(), "fast-app-memory-")
  );
  temporaryDirectories.push(temporaryDirectory);

  const database = openSqliteDatabase({
    databasePath: path.join(temporaryDirectory, "app.db")
  });
  applyMigrations(database, appMigrations);

  return database;
}

function makeLearnedAnswerInput(): CreateLearnedAnswerInput {
  return {
    rawLabel: "Are you authorized to work in the United States?",
    normalizedLabel: "authorized to work in united states",
    controlType: "radio",
    pageHost: "EXAMPLE.com",
    pagePathPattern: "/jobs/*",
    nearbyContext: "Eligibility",
    answer: {
      answerType: "option",
      value: "Yes"
    }
  };
}
