import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createServerApp } from "../../apps/server/src/app.js";
import { loadServerRuntimePaths } from "../../apps/server/src/config/runtime-paths.js";
import type { ApplicantProfile } from "../../packages/shared/src/index.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const temporaryDirectory of temporaryDirectories.splice(0)) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

describe("profile routes", () => {
  it("returns null before a profile is saved", async () => {
    const server = await createTemporaryServer();

    const response = await server.app.inject({
      method: "GET",
      url: "/profile"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      profile: null
    });

    await server.close();
  });

  it("persists and returns a validated profile", async () => {
    const server = await createTemporaryServer();

    const updateResponse = await server.app.inject({
      method: "PUT",
      url: "/profile",
      payload: makeProfile({
        fullName: "  Ada Lovelace  ",
        email: "  ada@example.com  "
      })
    });
    const getResponse = await server.app.inject({
      method: "GET",
      url: "/profile"
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toEqual({
      profile: {
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "+1 555 0100",
        location: "New York, NY",
        workAuthorization: "US citizen",
        sponsorshipRequired: false
      }
    });
    expect(getResponse.json()).toEqual(updateResponse.json());

    await server.close();
  });

  it("rejects invalid profile payloads with a structured error", async () => {
    const server = await createTemporaryServer();

    const response = await server.app.inject({
      method: "PUT",
      url: "/profile",
      payload: {
        ...makeProfile(),
        email: "not-an-email"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid profile payload."
      }
    });

    await server.close();
  });
});

async function createTemporaryServer() {
  return createServerApp({
    runtimePaths: createTemporaryRuntimePaths()
  });
}

function createTemporaryRuntimePaths() {
  const temporaryDirectory = mkdtempSync(
    path.join(os.tmpdir(), "fast-app-profile-routes-")
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

function makeProfile(overrides: Partial<ApplicantProfile> = {}): ApplicantProfile {
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
