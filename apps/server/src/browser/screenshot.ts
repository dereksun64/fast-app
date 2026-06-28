import fs from "node:fs";
import path from "node:path";

import type { Page } from "playwright";

import type { ServerRuntimePaths } from "../config/runtime-paths.js";

export interface CaptureScreenshotInput {
  readonly page: Page;
  readonly runtimePaths: Pick<ServerRuntimePaths, "screenshotsPath">;
  readonly runId: string;
  readonly reason: string;
  readonly now?: () => Date;
}

export interface ScreenshotCaptureResult {
  readonly filePath: string;
  readonly pageUrl: string;
  readonly reason: string;
}

export async function captureRunScreenshot(
  input: CaptureScreenshotInput
): Promise<ScreenshotCaptureResult> {
  const timestamp = (input.now ?? (() => new Date()))()
    .toISOString()
    .replaceAll(":", "-");
  const safeReason = sanitizeScreenshotReason(input.reason);
  const runDirectory = path.join(input.runtimePaths.screenshotsPath, input.runId);
  const filePath = path.join(runDirectory, `${timestamp}-${safeReason}.png`);

  fs.mkdirSync(runDirectory, { recursive: true });
  await input.page.screenshot({
    path: filePath,
    fullPage: true
  });

  return {
    filePath,
    pageUrl: input.page.url(),
    reason: input.reason
  };
}

export function sanitizeScreenshotReason(reason: string): string {
  const sanitized = reason
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return sanitized || "browser-step";
}
