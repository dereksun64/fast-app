import path from "node:path";
import { fileURLToPath } from "node:url";

export interface ServerRuntimePaths {
  readonly projectRoot: string;
  readonly databasePath: string;
  readonly browserProfilePath: string;
  readonly logsPath: string;
  readonly screenshotsPath: string;
  readonly allowedResumePaths: readonly string[];
}

export interface ServerRuntimePathEnv {
  readonly FAST_APP_PROJECT_ROOT?: string;
  readonly FAST_APP_DATABASE_PATH?: string;
  readonly FAST_APP_BROWSER_PROFILE_PATH?: string;
  readonly FAST_APP_LOGS_PATH?: string;
  readonly FAST_APP_SCREENSHOTS_PATH?: string;
  readonly FAST_APP_ALLOWED_RESUME_PATHS?: string;
}

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultProjectRoot = path.resolve(moduleDirectory, "../../../..");

export function loadServerRuntimePaths(
  env: ServerRuntimePathEnv = process.env
): ServerRuntimePaths {
  const projectRoot = resolvePath(
    env.FAST_APP_PROJECT_ROOT,
    defaultProjectRoot,
    defaultProjectRoot
  );
  const defaultDataPath = path.join(projectRoot, "data");

  return {
    projectRoot,
    databasePath: resolvePath(
      env.FAST_APP_DATABASE_PATH,
      path.join(defaultDataPath, "app.db"),
      projectRoot
    ),
    browserProfilePath: resolvePath(
      env.FAST_APP_BROWSER_PROFILE_PATH,
      path.join(defaultDataPath, "browser-profile"),
      projectRoot
    ),
    logsPath: resolvePath(
      env.FAST_APP_LOGS_PATH,
      path.join(defaultDataPath, "logs"),
      projectRoot
    ),
    screenshotsPath: resolvePath(
      env.FAST_APP_SCREENSHOTS_PATH,
      path.join(defaultDataPath, "screenshots"),
      projectRoot
    ),
    allowedResumePaths: parseAllowedResumePaths(
      env.FAST_APP_ALLOWED_RESUME_PATHS,
      path.join(defaultDataPath, "resumes"),
      projectRoot
    )
  };
}

function resolvePath(
  configuredPath: string | undefined,
  defaultPath: string,
  projectRoot: string
): string {
  const selectedPath = configuredPath?.trim() || defaultPath;

  if (path.isAbsolute(selectedPath)) {
    return path.normalize(selectedPath);
  }

  return path.resolve(projectRoot, selectedPath);
}

function parseAllowedResumePaths(
  configuredPaths: string | undefined,
  defaultPath: string,
  projectRoot: string
): readonly string[] {
  const pathValues =
    configuredPaths
      ?.split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0) ?? [];

  if (pathValues.length === 0) {
    return [resolvePath(undefined, defaultPath, projectRoot)];
  }

  return pathValues.map((pathValue) =>
    resolvePath(pathValue, pathValue, projectRoot)
  );
}
