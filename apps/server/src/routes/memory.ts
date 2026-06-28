import type { FastifyInstance } from "fastify";
import {
  listMemoryResponseSchema,
  updateLearnedAnswerRequestSchema,
  updateLearnedAnswerResponseSchema
} from "@fast-app/shared";

import type { ServerAppContext } from "../app.js";
import { notFound, parseBody, parseResponse } from "./api-errors.js";

interface MemoryRouteParams {
  readonly id: string;
}

export interface MemoryRoutesOptions {
  readonly context: ServerAppContext;
}

export async function registerMemoryRoutes(
  app: FastifyInstance,
  options: MemoryRoutesOptions
): Promise<void> {
  app.get("/memory", async () => {
    return parseResponse(listMemoryResponseSchema, {
      items: options.context.memoryRepository.listLearnedAnswers()
    });
  });

  app.patch<{ Params: MemoryRouteParams }>("/memory/:id", async (request) => {
    const updates = parseBody(
      updateLearnedAnswerRequestSchema,
      request.body,
      "Invalid learned-answer payload."
    );
    const updatedAnswer = options.context.memoryRepository.updateLearnedAnswer(
      request.params.id,
      updates
    );

    if (!updatedAnswer) {
      throw notFound("Learned answer not found.");
    }

    return parseResponse(updateLearnedAnswerResponseSchema, {
      item: updatedAnswer
    });
  });
}
