import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  applyMigrations,
  type Migration
} from "../../apps/server/src/db/migrations.js";
import {
  openSqliteDatabase,
  type SqliteDatabase
} from "../../apps/server/src/db/sqlite.js";

interface CountRow {
  readonly count: number;
}

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const temporaryDirectory of temporaryDirectories.splice(0)) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

describe("applyMigrations", () => {
  it("applies ordered migrations once and records them", () => {
    const database = openTemporaryDatabase();
    const migrations: readonly Migration[] = [
      {
        id: "001",
        name: "create audit table",
        sql: `
          CREATE TABLE migration_audit (
            value TEXT NOT NULL
          );
        `
      },
      {
        id: "002",
        name: "insert audit row",
        sql: "INSERT INTO migration_audit (value) VALUES ('applied');"
      }
    ];

    applyMigrations(database, migrations, () => "2026-06-28T00:00:00.000Z");
    applyMigrations(database, migrations, () => "2026-06-28T00:01:00.000Z");

    expect(countRows(database, "migration_audit")).toBe(1);
    expect(countRows(database, "schema_migrations")).toBe(2);

    database.close();
  });

  it("rejects duplicate migration ids before applying changes", () => {
    const database = openTemporaryDatabase();

    expect(() => {
      applyMigrations(database, [
        {
          id: "001",
          name: "first",
          sql: "CREATE TABLE first_table (id TEXT PRIMARY KEY);"
        },
        {
          id: "001",
          name: "duplicate",
          sql: "CREATE TABLE duplicate_table (id TEXT PRIMARY KEY);"
        }
      ]);
    }).toThrow("Duplicate migration id: 001");

    database.close();
  });
});

function openTemporaryDatabase(): SqliteDatabase {
  const temporaryDirectory = mkdtempSync(
    path.join(os.tmpdir(), "fast-app-migrations-")
  );
  temporaryDirectories.push(temporaryDirectory);

  return openSqliteDatabase({
    databasePath: path.join(temporaryDirectory, "app.db")
  });
}

function countRows(database: SqliteDatabase, tableName: string): number {
  const row = database
    .prepare<[], CountRow>(`SELECT COUNT(*) AS count FROM ${tableName}`)
    .get();

  return row?.count ?? 0;
}
