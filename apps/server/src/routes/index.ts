import type { FastifyInstance } from "fastify";

import type { ServerAppContext } from "../app.js";
import { registerApiErrorHandler } from "./api-errors.js";
import { registerMemoryRoutes } from "./memory.js";
import { registerProfileRoutes } from "./profile.js";
import { registerRunRoutes } from "./runs.js";

export interface RegisterRoutesOptions {
  readonly context: ServerAppContext;
}

export async function registerRoutes(
  app: FastifyInstance,
  options: RegisterRoutesOptions
): Promise<void> {
  registerApiErrorHandler(app);
  await registerProfileRoutes(app, options);
  await registerMemoryRoutes(app, options);
  await registerRunRoutes(app, options);
}
