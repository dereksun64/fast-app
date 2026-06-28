import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { ApplicantProfile } from "../../packages/shared/src/index.js";
import { applyMigrations } from "../../apps/server/src/db/migrations.js";
import { appMigrations } from "../../apps/server/src/db/migrations/index.js";
import {
  openSqliteDatabase,
  type SqliteDatabase
} from "../../apps/server/src/db/sqlite.js";
import { createProfileRepository } from "../../apps/server/src/profile/profile-repository.js";

interface ProfileTimestampRow {
  readonly created_at: string;
  readonly updated_at: string;
}

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const temporaryDirectory of temporaryDirectories.splice(0)) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

describe("createProfileRepository", () => {
  it("returns undefined before a profile is saved", () => {
    const database = openMigratedTemporaryDatabase();
    const repository = createProfileRepository(database);

    expect(repository.getProfile()).toBeUndefined();

    database.close();
  });

  it("validates and persists the default applicant profile", () => {
    const database = openMigratedTemporaryDatabase();
    const repository = createProfileRepository(database);

    const savedProfile = repository.updateProfile({
      fullName: "  Ada Lovelace  ",
      email: "  ada@example.com  ",
      phone: "  +1 555 0100  ",
      location: "  New York, NY  ",
      linkedinUrl: "https://www.linkedin.com/in/ada-lovelace",
      portfolioUrl: "https://ada.example.dev",
      workAuthorization: "US citizen",
      sponsorshipRequired: false,
      defaultResumePath: "  data/resumes/ada.pdf  "
    });

    expect(savedProfile).toEqual({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+1 555 0100",
      location: "New York, NY",
      linkedinUrl: "https://www.linkedin.com/in/ada-lovelace",
      portfolioUrl: "https://ada.example.dev",
      workAuthorization: "US citizen",
      sponsorshipRequired: false,
      defaultResumePath: "data/resumes/ada.pdf"
    });
    expect(repository.getProfile()).toEqual(savedProfile);

    database.close();
  });

  it("updates the existing profile without replacing the created timestamp", () => {
    const database = openMigratedTemporaryDatabase();
    const timestamps = [
      "2026-06-28T00:00:00.000Z",
      "2026-06-28T00:05:00.000Z"
    ];
    const repository = createProfileRepository(database, () => {
      const timestamp = timestamps.shift();

      if (!timestamp) {
        throw new Error("Unexpected timestamp request.");
      }

      return timestamp;
    });

    repository.updateProfile(makeProfile({ fullName: "Ada Lovelace" }));
    repository.updateProfile(makeProfile({ fullName: "Grace Hopper" }));

    expect(repository.getProfile()?.fullName).toBe("Grace Hopper");
    expect(readProfileTimestamps(database)).toEqual({
      created_at: "2026-06-28T00:00:00.000Z",
      updated_at: "2026-06-28T00:05:00.000Z"
    });

    database.close();
  });

  it("rejects invalid incoming profile data", () => {
    const database = openMigratedTemporaryDatabase();
    const repository = createProfileRepository(database);

    expect(() => {
      repository.updateProfile({
        ...makeProfile(),
        email: "not-an-email"
      });
    }).toThrow();

    database.close();
  });

  it("rejects invalid persisted profile data when reading", () => {
    const database = openMigratedTemporaryDatabase();

    database
      .prepare(
        `INSERT INTO applicant_profiles (
          id,
          profile_json,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?)`
      )
      .run(
        "default",
        JSON.stringify({ fullName: "Missing required fields" }),
        "2026-06-28T00:00:00.000Z",
        "2026-06-28T00:00:00.000Z"
      );

    const repository = createProfileRepository(database);

    expect(() => repository.getProfile()).toThrow();

    database.close();
  });
});

function openMigratedTemporaryDatabase(): SqliteDatabase {
  const temporaryDirectory = mkdtempSync(
    path.join(os.tmpdir(), "fast-app-profile-")
  );
  temporaryDirectories.push(temporaryDirectory);

  const database = openSqliteDatabase({
    databasePath: path.join(temporaryDirectory, "app.db")
  });
  applyMigrations(database, appMigrations);

  return database;
}

function makeProfile(
  overrides: Partial<ApplicantProfile> = {}
): ApplicantProfile {
  return {
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+1 555 0100",
    location: "New York, NY",
    workAuthorization: "US citizen",
    sponsorshipRequired: false,
    ...overrides
  };
}

function readProfileTimestamps(
  database: SqliteDatabase
): ProfileTimestampRow | undefined {
  return database
    .prepare<[], ProfileTimestampRow>(
      `SELECT created_at, updated_at
       FROM applicant_profiles
       WHERE id = 'default'`
    )
    .get();
}
