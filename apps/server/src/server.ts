import type { FastifyInstance } from "fastify";

import { createServerApp, type CreateServerAppOptions } from "./app.js";

export interface ServerListenOptions {
  readonly host: string;
  readonly port: number;
}

export interface ServerListenEnv {
  readonly FAST_APP_HOST?: string;
  readonly FAST_APP_PORT?: string;
}

export interface StartedServer {
  readonly app: FastifyInstance;
  readonly host: string;
  readonly port: number;
  close(): Promise<void>;
}

const defaultHost = "127.0.0.1";
const defaultPort = 4317;

export function loadServerListenOptions(
  env: ServerListenEnv = process.env
): ServerListenOptions {
  return {
    host: env.FAST_APP_HOST?.trim() || defaultHost,
    port: parsePort(env.FAST_APP_PORT)
  };
}

export async function startServer(
  options: CreateServerAppOptions & {
    readonly listen?: ServerListenOptions;
  } = {}
): Promise<StartedServer> {
  const listen = options.listen ?? loadServerListenOptions();
  const server = await createServerApp(options);

  await server.app.listen({
    host: listen.host,
    port: listen.port
  });

  return {
    app: server.app,
    host: listen.host,
    port: listen.port,
    close: () => server.close()
  };
}

function parsePort(configuredPort: string | undefined): number {
  if (!configuredPort?.trim()) {
    return defaultPort;
  }

  const port = Number(configuredPort);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("FAST_APP_PORT must be an integer between 1 and 65535.");
  }

  return port;
}
