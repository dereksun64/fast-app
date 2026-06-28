import type { FastifyInstance } from "fastify";
import {
  getProfileResponseSchema,
  updateProfileRequestSchema,
  updateProfileResponseSchema
} from "@fast-app/shared";

import type { ServerAppContext } from "../app.js";
import { parseBody, parseResponse } from "./api-errors.js";

export interface ProfileRoutesOptions {
  readonly context: ServerAppContext;
}

export async function registerProfileRoutes(
  app: FastifyInstance,
  options: ProfileRoutesOptions
): Promise<void> {
  app.get("/profile", async () => {
    return parseResponse(getProfileResponseSchema, {
      profile: options.context.profileRepository.getProfile() ?? null
    });
  });

  app.put("/profile", async (request) => {
    const profile = parseBody(
      updateProfileRequestSchema,
      request.body,
      "Invalid profile payload."
    );
    const updatedProfile = options.context.profileRepository.updateProfile(profile);

    return parseResponse(updateProfileResponseSchema, {
      profile: updatedProfile
    });
  });
}
