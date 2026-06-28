import type { FastifyInstance } from "fastify";
import {
  createRunRequestSchema,
  createRunResponseSchema,
  getRunResponseSchema,
  runEventSchema,
  respondToPromptRequestSchema,
  respondToPromptResponseSchema,
  runEventSchemaVersion
} from "@fast-app/shared";
import type { RunEvent } from "@fast-app/shared";

import type { ServerAppContext } from "../app.js";
import { notFound, parseBody, parseResponse } from "./api-errors.js";

interface RunRouteParams {
  readonly id: string;
}

interface PromptResponseRouteParams extends RunRouteParams {
  readonly promptId: string;
}

export interface RunRoutesOptions {
  readonly context: ServerAppContext;
}

export async function registerRunRoutes(
  app: FastifyInstance,
  options: RunRoutesOptions
): Promise<void> {
  app.post("/runs", async (request) => {
    const createRunRequest = parseBody(
      createRunRequestSchema,
      request.body,
      "Invalid run payload."
    );
    const response = options.context.stubRunner.createPendingRun(
      createRunRequest.jobUrl
    );

    return parseResponse(createRunResponseSchema, response);
  });

  app.get<{ Params: RunRouteParams }>("/runs/:id", async (request) => {
    const run = options.context.runRepository.getRun(request.params.id);

    if (!run) {
      throw notFound("Run not found.");
    }

    return parseResponse(getRunResponseSchema, {
      run,
      currentPrompt: options.context.runRepository.getCurrentPrompt(run.id),
      steps: options.context.runRepository.listRunSteps(run.id)
    });
  });

  app.get<{ Params: RunRouteParams }>("/runs/:id/events", async (request, reply) => {
    const run = options.context.runRepository.getRun(request.params.id);

    if (!run) {
      throw notFound("Run not found.");
    }

    reply.raw.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive"
    });
    reply.raw.write(": connected\n\n");
    reply.hijack();

    const unsubscribe = options.context.eventPublisher.subscribeToRun(
      run.id,
      (event) => {
        reply.raw.write(serializeRunEvent(event));

        if (isTerminalEvent(event)) {
          unsubscribe();
          reply.raw.end();
        }
      }
    );

    request.raw.on("close", unsubscribe);
  });

  app.post<{ Params: PromptResponseRouteParams }>(
    "/runs/:id/prompts/:promptId/respond",
    async (request) => {
      const run = options.context.runRepository.getRun(request.params.id);

      if (!run) {
        throw notFound("Run not found.");
      }

      const prompt = options.context.runRepository.getPrompt(
        request.params.promptId
      );

      if (!prompt || prompt.runId !== run.id) {
        throw notFound("Prompt not found for run.");
      }

      const promptResponseRequest = parseBody(
        respondToPromptRequestSchema,
        request.body,
        "Invalid prompt response payload."
      );
      const answeredPrompt = options.context.runRepository.answerPrompt(
        prompt.id,
        promptResponseRequest.response
      );

      if (!answeredPrompt) {
        throw notFound("Prompt not found for run.");
      }

      options.context.eventPublisher.publish({
        schemaVersion: runEventSchemaVersion,
        eventType: "promptAnswered",
        runId: run.id,
        prompt: answeredPrompt,
        at: new Date().toISOString()
      });

      return parseResponse(respondToPromptResponseSchema, {
        run: options.context.runRepository.getRun(run.id) ?? run,
        prompt: answeredPrompt
      });
    }
  );
}

function serializeRunEvent(event: RunEvent): string {
  const validatedEvent = runEventSchema.parse(event);

  return `event: ${validatedEvent.eventType}\ndata: ${JSON.stringify(
    validatedEvent
  )}\n\n`;
}

function isTerminalEvent(event: RunEvent): boolean {
  if (event.eventType === "runError") {
    return true;
  }

  return (
    event.eventType === "runStatusChanged" &&
    ["completed", "failed", "canceled"].includes(event.status)
  );
}
