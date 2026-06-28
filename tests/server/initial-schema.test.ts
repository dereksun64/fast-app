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

interface NameRow {
  readonly name: string;
}

interface CountRow {
  readonly count: number;
}

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const temporaryDirectory of temporaryDirectories.splice(0)) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

describe("initial schema migration", () => {
  it("creates the Phase 3 persistence tables and can be applied repeatedly", () => {
    const database = openTemporaryDatabase();

    applyMigrations(database, appMigrations);
    applyMigrations(database, appMigrations);

    expect(listTables(database)).toEqual([
      "applicant_profiles",
      "application_runs",
      "learned_answers",
      "prompts",
      "run_steps",
      "schema_migrations",
      "screenshot_metadata"
    ]);
    expect(countRows(database, "schema_migrations")).toBe(1);

    database.close();
  });

  it("enforces run relationships for prompts, steps, and screenshots", () => {
    const database = openTemporaryDatabase();
    applyMigrations(database, appMigrations);

    expect(() => {
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
            created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          "prompt-1",
          "missing-run",
          "open",
          "Question",
          "question",
          "text",
          "example.com",
          "Please answer this field.",
          "2026-06-28T00:00:00.000Z"
        );
    }).toThrow();

    insertRun(database, "run-1");
    insertPrompt(database, "prompt-1", "run-1");
    database
      .prepare(
        `UPDATE application_runs
         SET current_prompt_id = ?
         WHERE id = ?`
      )
      .run("prompt-1", "run-1");

    expect(() => {
      database
        .prepare(
          `UPDATE application_runs
           SET current_prompt_id = ?
           WHERE id = ?`
        )
        .run("missing-prompt", "run-1");
    }).toThrow();

    insertRunStep(database, "step-1", "run-1", "prompt-1");
    insertScreenshotMetadata(database, "screenshot-1", "run-1", "step-1");

    expect(countRows(database, "prompts")).toBe(1);
    expect(countRows(database, "run_steps")).toBe(1);
    expect(countRows(database, "screenshot_metadata")).toBe(1);

    database.prepare("DELETE FROM application_runs WHERE id = ?").run("run-1");

    expect(countRows(database, "prompts")).toBe(0);
    expect(countRows(database, "run_steps")).toBe(0);
    expect(countRows(database, "screenshot_metadata")).toBe(0);

    database.close();
  });

  it("keeps screenshot content out of the database schema", () => {
    const database = openTemporaryDatabase();
    applyMigrations(database, appMigrations);

    const columns = database
      .prepare<[], NameRow>("PRAGMA table_info(screenshot_metadata)")
      .all()
      .map((row) => row.name);

    expect(columns).toEqual([
      "id",
      "run_id",
      "step_id",
      "file_path",
      "page_url",
      "reason",
      "created_at"
    ]);

    database.close();
  });
});

function openTemporaryDatabase(): SqliteDatabase {
  const temporaryDirectory = mkdtempSync(
    path.join(os.tmpdir(), "fast-app-schema-")
  );
  temporaryDirectories.push(temporaryDirectory);

  return openSqliteDatabase({
    databasePath: path.join(temporaryDirectory, "app.db")
  });
}

function listTables(database: SqliteDatabase): string[] {
  return database
    .prepare<[], NameRow>(
      `SELECT name
       FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name`
    )
    .all()
    .map((row) => row.name);
}

function countRows(database: SqliteDatabase, tableName: string): number {
  const row = database
    .prepare<[], CountRow>(`SELECT COUNT(*) AS count FROM ${tableName}`)
    .get();

  return row?.count ?? 0;
}

function insertRun(database: SqliteDatabase, runId: string): void {
  database
    .prepare(
      `INSERT INTO application_runs (
        id,
        job_url,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      runId,
      "https://example.com/jobs/1",
      "pending",
      "2026-06-28T00:00:00.000Z",
      "2026-06-28T00:00:00.000Z"
    );
}

function insertPrompt(
  database: SqliteDatabase,
  promptId: string,
  runId: string
): void {
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
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      promptId,
      runId,
      "open",
      "Question",
      "question",
      "text",
      "example.com",
      "Please answer this field.",
      "2026-06-28T00:00:01.000Z"
    );
}

function insertRunStep(
  database: SqliteDatabase,
  stepId: string,
  runId: string,
  promptId: string
): void {
  database
    .prepare(
      `INSERT INTO run_steps (
        id,
        run_id,
        status,
        level,
        message,
        prompt_id,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      stepId,
      runId,
      "prompting",
      "info",
      "Prompt created.",
      promptId,
      "2026-06-28T00:00:02.000Z"
    );
}

function insertScreenshotMetadata(
  database: SqliteDatabase,
  screenshotId: string,
  runId: string,
  stepId: string
): void {
  database
    .prepare(
      `INSERT INTO screenshot_metadata (
        id,
        run_id,
        step_id,
        file_path,
        reason,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      screenshotId,
      runId,
      stepId,
      "data/screenshots/run-1-step-1.png",
      "review",
      "2026-06-28T00:00:03.000Z"
    );
}
