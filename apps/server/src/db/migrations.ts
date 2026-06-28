import type { SqliteDatabase } from "./sqlite.js";

export interface Migration {
  readonly id: string;
  readonly name: string;
  readonly sql: string;
}

interface AppliedMigrationRow {
  readonly id: string;
}

export function applyMigrations(
  database: SqliteDatabase,
  migrations: readonly Migration[],
  now: () => string = () => new Date().toISOString()
): void {
  ensureUniqueMigrationIds(migrations);
  ensureMigrationsTable(database);

  const appliedMigrationIds = new Set(
    database
      .prepare<[], AppliedMigrationRow>(
        "SELECT id FROM schema_migrations ORDER BY id"
      )
      .all()
      .map((row) => row.id)
  );

  const runPendingMigrations = database.transaction(() => {
    for (const migration of migrations) {
      if (appliedMigrationIds.has(migration.id)) {
        continue;
      }

      database.exec(migration.sql);
      database
        .prepare(
          `INSERT INTO schema_migrations (id, name, applied_at)
           VALUES (?, ?, ?)`
        )
        .run(migration.id, migration.name, now());
      appliedMigrationIds.add(migration.id);
    }
  });

  runPendingMigrations();
}

function ensureMigrationsTable(database: SqliteDatabase): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
}

function ensureUniqueMigrationIds(migrations: readonly Migration[]): void {
  const migrationIds = new Set<string>();

  for (const migration of migrations) {
    if (migrationIds.has(migration.id)) {
      throw new Error(`Duplicate migration id: ${migration.id}`);
    }

    migrationIds.add(migration.id);
  }
}
