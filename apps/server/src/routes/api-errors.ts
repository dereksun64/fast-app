import type { FastifyInstance, FastifyReply } from "fastify";

interface ApiErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function badRequest(message: string): ApiError {
  return new ApiError(400, "BAD_REQUEST", message);
}

export function notFound(message: string): ApiError {
  return new ApiError(404, "NOT_FOUND", message);
}

export function registerApiErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ApiError) {
      sendApiError(reply, error.statusCode, error.code, error.message);
      return;
    }

    sendApiError(reply, 500, "INTERNAL_SERVER_ERROR", "Internal server error.");
  });
}

export function parseBody<Output>(
  schema: {
    safeParse(value: unknown):
      | { readonly success: true; readonly data: Output }
      | { readonly success: false };
  },
  value: unknown,
  message = "Invalid request body."
): Output {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw badRequest(message);
  }

  return result.data;
}

export function parseResponse<Output>(
  schema: {
    parse(value: unknown): Output;
  },
  value: unknown
): Output {
  return schema.parse(value);
}

function sendApiError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string
): void {
  const body: ApiErrorBody = {
    error: {
      code,
      message
    }
  };

  reply.status(statusCode).send(body);
}
