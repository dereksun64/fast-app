import fs from "node:fs";

import {
  chromium,
  type BrowserContext,
  type LaunchOptions,
  type Page
} from "playwright";

import type { ServerRuntimePaths } from "../config/runtime-paths.js";

export interface BrowserService {
  readonly browserProfilePath: string;
  openContext(): Promise<BrowserContext>;
  openPage(url: string): Promise<Page>;
  close(): Promise<void>;
}

export interface CreateBrowserServiceOptions {
  readonly runtimePaths: Pick<ServerRuntimePaths, "browserProfilePath">;
  readonly headless?: boolean;
  readonly launchOptions?: Omit<LaunchOptions, "headless">;
}

export interface BrowserLaunchConfiguration {
  readonly userDataDir: string;
  readonly headless: boolean;
  readonly launchOptions: LaunchOptions;
}

export function createBrowserService(
  options: CreateBrowserServiceOptions
): BrowserService {
  let context: BrowserContext | undefined;
  const launchConfiguration = createBrowserLaunchConfiguration(options);

  return {
    browserProfilePath: launchConfiguration.userDataDir,

    async openContext(): Promise<BrowserContext> {
      if (context) {
        return context;
      }

      fs.mkdirSync(launchConfiguration.userDataDir, { recursive: true });
      context = await chromium.launchPersistentContext(
        launchConfiguration.userDataDir,
        launchConfiguration.launchOptions
      );
      context.on("close", () => {
        context = undefined;
      });

      return context;
    },

    async openPage(url: string): Promise<Page> {
      const pageUrl = validateNavigationUrl(url);
      const browserContext = await this.openContext();
      const page =
        browserContext.pages()[0] ?? (await browserContext.newPage());

      await page.goto(pageUrl, {
        waitUntil: "domcontentloaded"
      });

      return page;
    },

    async close(): Promise<void> {
      if (!context) {
        return;
      }

      const currentContext = context;
      context = undefined;
      await currentContext.close();
    }
  };
}

export function createBrowserLaunchConfiguration(
  options: CreateBrowserServiceOptions
): BrowserLaunchConfiguration {
  return {
    userDataDir: options.runtimePaths.browserProfilePath,
    headless: options.headless ?? false,
    launchOptions: {
      ...options.launchOptions,
      headless: options.headless ?? false
    }
  };
}

export function validateNavigationUrl(url: string): string {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("A valid job application URL is required.");
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Job application URLs must use http or https.");
  }

  return parsedUrl.toString();
}
