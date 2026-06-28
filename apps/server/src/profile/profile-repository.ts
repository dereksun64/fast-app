import {
  applicantProfileSchema,
  type ApplicantProfile
} from "@fast-app/shared";

import type { SqliteDatabase } from "../db/sqlite.js";

const defaultProfileId = "default";

interface ProfileRow {
  readonly profile_json: string;
}

export interface ProfileRepository {
  getProfile(): ApplicantProfile | undefined;
  updateProfile(profile: ApplicantProfile): ApplicantProfile;
}

export function createProfileRepository(
  database: SqliteDatabase,
  now: () => string = () => new Date().toISOString()
): ProfileRepository {
  return {
    getProfile(): ApplicantProfile | undefined {
      const row = database
        .prepare<[string], ProfileRow>(
          `SELECT profile_json
           FROM applicant_profiles
           WHERE id = ?`
        )
        .get(defaultProfileId);

      if (!row) {
        return undefined;
      }

      return parseStoredProfile(row.profile_json);
    },

    updateProfile(profile: ApplicantProfile): ApplicantProfile {
      const validatedProfile = applicantProfileSchema.parse(profile);
      const profileJson = JSON.stringify(validatedProfile);
      const timestamp = now();

      database
        .prepare(
          `INSERT INTO applicant_profiles (
            id,
            profile_json,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            profile_json = excluded.profile_json,
            updated_at = excluded.updated_at`
        )
        .run(defaultProfileId, profileJson, timestamp, timestamp);

      return validatedProfile;
    }
  };
}

function parseStoredProfile(profileJson: string): ApplicantProfile {
  const parsedJson: unknown = JSON.parse(profileJson);

  return applicantProfileSchema.parse(parsedJson);
}
