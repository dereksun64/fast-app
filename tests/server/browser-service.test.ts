import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  createBrowserLaunchConfiguration,
  validateNavigationUrl
} from "../../apps/server/src/browser/playwright.js";
import { sanitizeScreenshotReason } from "../../apps/server/src/browser/screenshot.js";

describe("browser launch configuration", () => {
  it("uses the configured persistent profile path and visible browser mode by default", () => {
    const profilePath = path.join("/tmp", "fast-app-browser-profile");
    const configuration = createBrowserLaunchConfiguration({
      runtimePaths: {
        browserProfilePath: profilePath
      }
    });

    expect(configuration.userDataDir).toBe(profilePath);
    expect(configuration.headless).toBe(false);
    expect(configuration.launchOptions.headless).toBe(false);
  });

  it("allows tests to override headless mode without changing the production default", () => {
    const configuration = createBrowserLaunchConfiguration({
      runtimePaths: {
        browserProfilePath: path.join("/tmp", "fast-app-browser-profile")
      },
      headless: true
    });

    expect(configuration.headless).toBe(true);
    expect(configuration.launchOptions.headless).toBe(true);
  });
});

describe("validateNavigationUrl", () => {
  it("accepts http and https job application URLs", () => {
    expect(validateNavigationUrl("https://jobs.example.com/apply")).toBe(
      "https://jobs.example.com/apply"
    );
    expect(validateNavigationUrl("http://localhost:3000/apply")).toBe(
      "http://localhost:3000/apply"
    );
  });

  it("rejects invalid or non-web URLs at the browser boundary", () => {
    expect(() => validateNavigationUrl("not a url")).toThrow(
      "A valid job application URL is required."
    );
    expect(() => validateNavigationUrl("file:///tmp/form.html")).toThrow(
      "Job application URLs must use http or https."
    );
  });
});

describe("sanitizeScreenshotReason", () => {
  it("creates safe local screenshot filename fragments", () => {
    expect(sanitizeScreenshotReason("Prompt Needed / Failure")).toBe(
      "prompt-needed-failure"
    );
    expect(sanitizeScreenshotReason("   ")).toBe("browser-step");
  });
});
