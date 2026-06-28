import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadServerRuntimePaths } from "../../apps/server/src/config/runtime-paths.js";

describe("loadServerRuntimePaths", () => {
  it("uses local data path defaults under the project root", () => {
    const projectRoot = path.resolve("/tmp/fast-app-test");

    const paths = loadServerRuntimePaths({
      FAST_APP_PROJECT_ROOT: projectRoot
    });

    expect(paths).toEqual({
      projectRoot,
      databasePath: path.join(projectRoot, "data", "app.db"),
      browserProfilePath: path.join(projectRoot, "data", "browser-profile"),
      logsPath: path.join(projectRoot, "data", "logs"),
      screenshotsPath: path.join(projectRoot, "data", "screenshots"),
      allowedResumePaths: [path.join(projectRoot, "data", "resumes")]
    });
  });

  it("resolves relative overrides from the configured project root", () => {
    const projectRoot = path.resolve("/tmp/fast-app-test");

    const paths = loadServerRuntimePaths({
      FAST_APP_PROJECT_ROOT: projectRoot,
      FAST_APP_DATABASE_PATH: "local/app.sqlite",
      FAST_APP_BROWSER_PROFILE_PATH: "profiles/default",
      FAST_APP_LOGS_PATH: "runtime/logs",
      FAST_APP_SCREENSHOTS_PATH: "runtime/screenshots",
      FAST_APP_ALLOWED_RESUME_PATHS: "resumes/current, resumes/archive"
    });

    expect(paths.databasePath).toBe(
      path.join(projectRoot, "local", "app.sqlite")
    );
    expect(paths.browserProfilePath).toBe(
      path.join(projectRoot, "profiles", "default")
    );
    expect(paths.logsPath).toBe(path.join(projectRoot, "runtime", "logs"));
    expect(paths.screenshotsPath).toBe(
      path.join(projectRoot, "runtime", "screenshots")
    );
    expect(paths.allowedResumePaths).toEqual([
      path.join(projectRoot, "resumes", "current"),
      path.join(projectRoot, "resumes", "archive")
    ]);
  });

  it("keeps absolute override paths absolute", () => {
    const paths = loadServerRuntimePaths({
      FAST_APP_PROJECT_ROOT: path.resolve("/tmp/fast-app-test"),
      FAST_APP_DATABASE_PATH: path.resolve("/tmp/app.db"),
      FAST_APP_ALLOWED_RESUME_PATHS: `${path.resolve(
        "/tmp/resumes"
      )}, data/resumes`
    });

    expect(paths.databasePath).toBe(path.resolve("/tmp/app.db"));
    expect(paths.allowedResumePaths).toEqual([
      path.resolve("/tmp/resumes"),
      path.resolve("/tmp/fast-app-test/data/resumes")
    ]);
  });
});
