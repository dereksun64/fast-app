import fastify, { type FastifyInstance } from "fastify";

import {
  createBrowserService,
  type BrowserService
} from "./browser/playwright.js";
import {
  loadServerRuntimePaths,
  type ServerRuntimePaths
} from "./config/runtime-paths.js";
import { applyMigrations } from "./db/migrations.js";
import { appMigrations } from "./db/migrations/index.js";
import {
  openSqliteDatabase,
  type SqliteDatabase
} from "./db/sqlite.js";
import {
  createMemoryRepository,
  type MemoryRepository
} from "./memory/memory-repository.js";
import {
  createProfileRepository,
  type ProfileRepository
} from "./profile/profile-repository.js";
import { registerRoutes } from "./routes/index.js";
import type { SiteAdapter } from "./adapters/site-adapter.js";
import { createPromptBridge, type PromptBridge } from "./runner/prompt-bridge.js";
import { createRunManager, type RunManager } from "./runner/run-manager.js";
import {
  createRunRepository,
  type RunRepository
} from "./runner/run-repository.js";
import {
  createRunEventPublisher,
  type RunEventPublisher
} from "./runner/step-publisher.js";
import { createStubRunner, type StubRunner } from "./runner/stub-runner.js";

export interface ServerAppContext {
  readonly runtimePaths: ServerRuntimePaths;
  readonly database: SqliteDatabase;
  readonly profileRepository: ProfileRepository;
  readonly memoryRepository: MemoryRepository;
  readonly runRepository: RunRepository;
  readonly eventPublisher: RunEventPublisher;
  readonly stubRunner: StubRunner;
  readonly promptBridge: PromptBridge;
  readonly runManager: RunManager;
  readonly browserService: BrowserService;
}

export interface CreateServerAppOptions {
  readonly runtimePaths?: ServerRuntimePaths;
  readonly database?: SqliteDatabase;
  readonly browserService?: BrowserService;
  readonly siteAdapter?: SiteAdapter;
  readonly now?: () => string;
  readonly createId?: () => string;
}

export interface CreatedServerApp {
  readonly app: FastifyInstance;
  readonly context: ServerAppContext;
  close(): Promise<void>;
}

export async function createServerApp(
  options: CreateServerAppOptions = {}
): Promise<CreatedServerApp> {
  const runtimePaths = options.runtimePaths ?? loadServerRuntimePaths();
  validateRuntimePaths(runtimePaths);

  const database =
    options.database ??
    openSqliteDatabase({
      databasePath: runtimePaths.databasePath
    });

  applyMigrations(database, appMigrations, options.now);

  const profileRepository = createProfileRepository(database, options.now);
  const memoryRepository = createMemoryRepository(
    database,
    repositoryOptions(options)
  );
  const runRepository = createRunRepository(database, repositoryOptions(options));
  const eventPublisher = createRunEventPublisher();
  const browserService =
    options.browserService ??
    createBrowserService({
      runtimePaths
    });
  const promptBridge = createPromptBridge({
    runRepository,
    memoryRepository,
    eventPublisher,
    ...stubRunnerOptions(options)
  });
  const runManager = createRunManager({
    browserService,
    profileRepository,
    memoryRepository,
    runRepository,
    eventPublisher,
    promptBridge,
    ...(options.siteAdapter ? { siteAdapter: options.siteAdapter } : {}),
    ...stubRunnerOptions(options)
  });

  const context: ServerAppContext = {
    runtimePaths,
    database,
    profileRepository,
    memoryRepository,
    runRepository,
    eventPublisher,
    stubRunner: createStubRunner({
      runRepository,
      eventPublisher,
      ...stubRunnerOptions(options)
    }),
    promptBridge,
    runManager,
    browserService
  };

  const app = fastify({
    logger: false
  });

  app.addHook("onClose", async () => {
    if (!options.browserService) {
      await browserService.close();
    }

    if (!options.database) {
      database.close();
    }
  });

  await registerRoutes(app, { context });

  return {
    app,
    context,
    close: () => app.close()
  };
}

function repositoryOptions(options: CreateServerAppOptions): {
  readonly now?: () => string;
  readonly createId?: () => string;
} {
  return {
    ...(options.now ? { now: options.now } : {}),
    ...(options.createId ? { createId: options.createId } : {})
  };
}

function stubRunnerOptions(options: CreateServerAppOptions): {
  readonly now?: () => string;
} {
  return {
    ...(options.now ? { now: options.now } : {})
  };
}

function validateRuntimePaths(runtimePaths: ServerRuntimePaths): void {
  const requiredPaths = [
    ["projectRoot", runtimePaths.projectRoot],
    ["databasePath", runtimePaths.databasePath],
    ["browserProfilePath", runtimePaths.browserProfilePath],
    ["logsPath", runtimePaths.logsPath],
    ["screenshotsPath", runtimePaths.screenshotsPath]
  ] as const;

  for (const [name, value] of requiredPaths) {
    if (value.trim().length === 0) {
      throw new Error(`Server runtime path ${name} is required.`);
    }
  }

  if (runtimePaths.allowedResumePaths.length === 0) {
    throw new Error("At least one allowed resume path is required.");
  }
}
