import { pathToFileURL } from "node:url";

import { startServer } from "./server.js";

export { createServerApp } from "./app.js";
export { loadServerListenOptions, startServer } from "./server.js";

async function main(): Promise<void> {
  const server = await startServer();

  console.log(`Fast App server listening at http://${server.host}:${server.port}`);

  const close = async (): Promise<void> => {
    await server.close();
  };

  process.once("SIGINT", close);
  process.once("SIGTERM", close);
}

if (process.argv[1] && import.meta.url === pathToFileUrl(process.argv[1])) {
  main().catch((error: unknown) => {
    console.error("Failed to start Fast App server.", error);
    process.exitCode = 1;
  });
}

function pathToFileUrl(filePath: string): string {
  return pathToFileURL(filePath).href;
}
