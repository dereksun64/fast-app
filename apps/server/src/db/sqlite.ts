import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

export type SqliteDatabase = Database.Database;

export interface OpenSqliteDatabaseOptions {
  readonly databasePath: string;
}

export function openSqliteDatabase({
  databasePath
}: OpenSqliteDatabaseOptions): SqliteDatabase {
  mkdirSync(path.dirname(databasePath), { recursive: true });

  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");

  return database;
}

export function isForeignKeyEnforcementEnabled(
  database: SqliteDatabase
): boolean {
  return database.pragma("foreign_keys", { simple: true }) === 1;
}
