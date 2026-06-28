import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  isForeignKeyEnforcementEnabled,
  openSqliteDatabase,
  type SqliteDatabase
} from "../../apps/server/src/db/sqlite.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const temporaryDirectory of temporaryDirectories.splice(0)) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

describe("openSqliteDatabase", () => {
  it("creates the database directory and enables foreign keys", () => {
    const database = openTemporaryDatabase("nested/app.db");

    expect(isForeignKeyEnforcementEnabled(database)).toBe(true);

    database.close();
  });

  it("enforces foreign key constraints on the connection", () => {
    const database = openTemporaryDatabase("app.db");

    database.exec(`
      CREATE TABLE parent_records (
        id TEXT PRIMARY KEY
      );

      CREATE TABLE child_records (
        id TEXT PRIMARY KEY,
        parent_id TEXT NOT NULL,
        FOREIGN KEY (parent_id) REFERENCES parent_records(id)
      );
    `);

    expect(() => {
      database
        .prepare(
          "INSERT INTO child_records (id, parent_id) VALUES (?, ?)"
        )
        .run("child-1", "missing-parent");
    }).toThrow();

    database.close();
  });
});

function openTemporaryDatabase(relativeDatabasePath: string): SqliteDatabase {
  const temporaryDirectory = mkdtempSync(
    path.join(os.tmpdir(), "fast-app-sqlite-")
  );
  temporaryDirectories.push(temporaryDirectory);

  return openSqliteDatabase({
    databasePath: path.join(temporaryDirectory, relativeDatabasePath)
  });
}
