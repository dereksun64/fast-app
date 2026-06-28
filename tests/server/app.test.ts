import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createServerApp } from "../../apps/server/src/app.js";
import { loadServerRuntimePaths } from "../../apps/server/src/config/runtime-paths.js";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const temporaryDirectory of temporaryDirectories.splice(0)) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

describe("createServerApp", () => {
  it("creates a testable app without listening on a port", async () => {
    const server = await createServerApp({
      runtimePaths: createTemporaryRuntimePaths()
    });

    const response = await server.app.inject({
      method: "GET",
      url: "/missing"
    });

    expect(response.statusCode).toBe(404);

    await server.close();
  });

  it("applies migrations and wires repositories", async () => {
    const server = await createServerApp({
      runtimePaths: createTemporaryRuntimePaths(),
      now: () => "2026-06-28T00:00:00.000Z",
      createId: () => "run-1"
    });

    const run = server.context.runRepository.createRun(
      "https://example.com/jobs/1"
    );
    const migrationCount = server.context.database
      .prepare<[], { readonly count: number }>(
        "SELECT COUNT(*) AS count FROM schema_migrations"
      )
      .get()?.count;

    expect(run).toMatchObject({
      id: "run-1",
      status: "pending"
    });
    expect(server.context.profileRepository.getProfile()).toBeUndefined();
    expect(server.context.memoryRepository.listLearnedAnswers()).toEqual([]);
    expect(migrationCount).toBeGreaterThan(0);

    await server.close();
  });

  it("publishes validated in-memory run events", async () => {
    const server = await createServerApp({
      runtimePaths: createTemporaryRuntimePaths()
    });
    const events: string[] = [];
    const unsubscribe = server.context.eventPublisher.subscribeToRun(
      "run-1",
      (event) => {
        events.push(event.eventType);
      }
    );

    server.context.eventPublisher.publish({
      schemaVersion: 1,
      eventType: "runStatusChanged",
      runId: "run-1",
      status: "pending",
      at: "2026-06-28T00:00:00.000Z"
    });
    server.context.eventPublisher.publish({
      schemaVersion: 1,
      eventType: "runStatusChanged",
      runId: "run-2",
      status: "pending",
      at: "2026-06-28T00:00:00.000Z"
    });
    unsubscribe();

    expect(events).toEqual(["runStatusChanged"]);

    await server.close();
  });
});

function createTemporaryRuntimePaths() {
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), "fast-app-api-"));
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
