import {
  createRunResponseSchema,
  runEventSchemaVersion,
  type CreateRunResponse
} from "@fast-app/shared";

import type { RunRepository } from "./run-repository.js";
import type { RunEventPublisher } from "./step-publisher.js";

export interface StubRunner {
  createPendingRun(jobUrl: string): CreateRunResponse;
}

export interface CreateStubRunnerOptions {
  readonly runRepository: RunRepository;
  readonly eventPublisher: RunEventPublisher;
  readonly now?: () => string;
}

export function createStubRunner(options: CreateStubRunnerOptions): StubRunner {
  const now = options.now ?? (() => new Date().toISOString());

  return {
    createPendingRun(jobUrl: string): CreateRunResponse {
      const run = options.runRepository.createRun(jobUrl);
      options.eventPublisher.publish({
        schemaVersion: runEventSchemaVersion,
        eventType: "runStatusChanged",
        runId: run.id,
        status: run.status,
        at: now()
      });

      const step = options.runRepository.appendRunStep({
        runId: run.id,
        status: run.status,
        level: "info",
        message: "Run created. Browser automation is not started in Phase 4."
      });
      options.eventPublisher.publish({
        schemaVersion: runEventSchemaVersion,
        eventType: "runStepAdded",
        runId: run.id,
        step,
        at: now()
      });

      return createRunResponseSchema.parse({
        run: options.runRepository.getRun(run.id) ?? run
      });
    }
  };
}
