import fs from "node:fs";

import { chromium, type Browser, type Page } from "playwright";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  createFailureStepMetadata,
  createGenericDomAdapter,
  createScanStepMetadata
} from "../../apps/server/src/adapters/generic-dom-adapter.js";
import type { ResolverDecision } from "../../apps/server/src/resolvers/index.js";

const browserExecutableExists = fs.existsSync(chromium.executablePath());
const describeWithBrowser = browserExecutableExists ? describe : describe.skip;

describeWithBrowser("generic DOM adapter", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.route("https://jobs.example.test/apply", async (route) => {
      await route.fulfill({
        contentType: "text/html",
        body: syntheticApplicationForm()
      });
    });
    await page.goto("https://jobs.example.test/apply");
  });

  afterAll(async () => {
    await browser.close();
  });

  it("scans common controls into resolver-compatible field descriptors", async () => {
    const adapter = createGenericDomAdapter();
    const fields = await adapter.scanPage(page);

    expect(fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "First name",
          controlType: "text",
          pageHost: "jobs.example.test",
          pagePath: "/apply",
          id: "first-name",
          name: "firstName",
          required: true
        }),
        expect.objectContaining({
          label: "Email address",
          controlType: "text",
          placeholder: "name@example.com"
        }),
        expect.objectContaining({
          label: "Phone number",
          controlType: "text"
        }),
        expect.objectContaining({
          label: "LinkedIn profile",
          controlType: "text"
        }),
        expect.objectContaining({
          label: "Why this role?",
          controlType: "textarea"
        }),
        expect.objectContaining({
          label: "How did you hear about us?",
          controlType: "select",
          options: [
            { label: "Choose one", value: "" },
            { label: "LinkedIn", value: "linkedin" },
            { label: "Referral", value: "referral" }
          ]
        }),
        expect.objectContaining({
          label: "I am authorized to work in the United States",
          controlType: "checkbox",
          options: [
            {
              label: "I am authorized to work in the United States",
              value: "yes"
            }
          ]
        }),
        expect.objectContaining({
          label: "Will you now or in the future require sponsorship?",
          controlType: "radio",
          name: "sponsorship",
          options: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" }
          ]
        })
      ])
    );
  });

  it("uses placeholder, ARIA labelled-by, legends, and nearby text as context", async () => {
    const adapter = createGenericDomAdapter();
    const fields = await adapter.scanPage(page);
    const portfolio = fields.find((field) => field.name === "portfolio");
    const sponsorship = fields.find((field) => field.name === "sponsorship");

    expect(portfolio).toMatchObject({
      label: "Portfolio URL",
      placeholder: "Portfolio URL"
    });
    expect(portfolio?.nearbyContext).toContain("personal details");
    expect(sponsorship).toMatchObject({
      label: "Will you now or in the future require sponsorship?"
    });
    expect(sponsorship?.nearbyContext).toContain(
      "eligibility will you now or in the future require sponsorship"
    );
  });

  it("fills only resolver fill decisions and omits answer values from metadata", async () => {
    const adapter = createGenericDomAdapter();
    const fields = await adapter.scanPage(page);
    const firstName = requiredField(fields, "firstName");
    const email = requiredField(fields, "email");
    const source = "profile" as const;

    const textResult = await adapter.fillField(page, {
      action: "fill",
      source,
      confidence: 1,
      field: firstName,
      answer: {
        answerType: "text",
        value: "Ada"
      },
      reason: "Matched profile field."
    });
    const promptResult = await adapter.fillField(page, {
      action: "prompt",
      confidence: 0,
      field: email,
      reason: "low-confidence",
      message: "Ask the user."
    });

    expect(await page.locator("#first-name").inputValue()).toBe("Ada");
    expect(await page.locator("#email").inputValue()).toBe("");
    expect(textResult.metadata).toMatchObject({
      action: "fill",
      fieldLabel: "First name",
      decisionAction: "fill",
      source: "profile"
    });
    expect(promptResult.metadata).toMatchObject({
      action: "prompt-needed",
      fieldLabel: "Email address",
      decisionAction: "prompt"
    });
    expect(JSON.stringify(textResult.metadata)).not.toContain("Ada");
  });

  it("fills select, checkbox, and radio decisions safely", async () => {
    const adapter = createGenericDomAdapter();
    const fields = await adapter.scanPage(page);

    await adapter.fillField(page, fillDecision(requiredField(fields, "source"), {
      answerType: "option",
      value: "linkedin"
    }));
    await adapter.fillField(page, fillDecision(requiredField(fields, "authorized"), {
      answerType: "boolean",
      value: true
    }));
    await adapter.fillField(page, fillDecision(requiredField(fields, "sponsorship"), {
      answerType: "option",
      value: "no"
    }));

    expect(await page.locator("#source").inputValue()).toBe("linkedin");
    await expectChecked(page, "#authorized", true);
    await expectChecked(page, "input[name='sponsorship'][value='no']", true);
  });

  it("does not mutate the page for prompt or skip decisions", async () => {
    const adapter = createGenericDomAdapter();
    const fields = await adapter.scanPage(page);
    const email = requiredField(fields, "email");
    const portfolio = requiredField(fields, "portfolio");

    await adapter.fillField(page, {
      action: "prompt",
      confidence: 0,
      field: email,
      reason: "low-confidence",
      message: "Ask the user."
    });
    await adapter.fillField(page, {
      action: "skip",
      confidence: 0,
      field: portfolio,
      reason: "unsafe-control",
      message: "Skip unsafe field."
    });

    expect(await page.locator("#email").inputValue()).toBe("");
    expect(await page.locator("#portfolio").inputValue()).toBe("");
  });

  it("classifies continuation controls as data without clicking them", async () => {
    const adapter = createGenericDomAdapter();
    const controls = await adapter.classifyContinuationControls(page);

    expect(controls).toEqual(
      expect.arrayContaining([
        {
          label: "Continue",
          controlType: "button",
          kind: "continue"
        },
        {
          label: "Submit application",
          controlType: "button",
          kind: "final-submit"
        }
      ])
    );
  });
});

describe("browser step metadata", () => {
  it("records scan and failure context without answer values", () => {
    expect(createScanStepMetadata("https://jobs.example.test/apply", 8)).toEqual({
      action: "scan",
      pageUrl: "https://jobs.example.test/apply",
      fieldCount: 8
    });
    expect(
      createFailureStepMetadata("https://jobs.example.test/apply", "locator failed", {
        label: "Email address",
        controlType: "text",
        pageHost: "jobs.example.test"
      })
    ).toEqual({
      action: "failure",
      pageUrl: "https://jobs.example.test/apply",
      reason: "locator failed",
      fieldLabel: "Email address",
      controlType: "text"
    });
  });
});

function requiredField(
  fields: readonly Awaited<
    ReturnType<ReturnType<typeof createGenericDomAdapter>["scanPage"]>
  >[number][],
  name: string
) {
  const field = fields.find((candidate) => candidate.name === name);

  if (!field) {
    throw new Error(`Expected field ${name} to be scanned.`);
  }

  return field;
}

function fillDecision(
  field: ReturnType<typeof requiredField>,
  answer: Extract<ResolverDecision, { action: "fill" }>["answer"]
): Extract<ResolverDecision, { action: "fill" }> {
  return {
    action: "fill",
    source: "profile",
    confidence: 1,
    field,
    answer,
    reason: "Matched test profile."
  };
}

async function expectChecked(
  page: Page,
  selector: string,
  expected: boolean
): Promise<void> {
  expect(await page.locator(selector).isChecked()).toBe(expected);
}

function syntheticApplicationForm(): string {
  return `<!doctype html>
    <html>
      <body>
        <form>
          <section>
            <h2>Personal details</h2>
            <label for="first-name">First name</label>
            <input id="first-name" name="firstName" required />

            <input id="email" name="email" type="email" placeholder="name@example.com" aria-label="Email address" />

            <span id="phone-label">Phone number</span>
            <input id="phone" name="phone" type="tel" aria-labelledby="phone-label" />

            <input id="portfolio" name="portfolio" placeholder="Portfolio URL" />

            <label for="linkedin">LinkedIn profile</label>
            <input id="linkedin" name="linkedin" type="url" />
          </section>

          <label for="why">Why this role?</label>
          <textarea id="why" name="why"></textarea>

          <label for="source">How did you hear about us?</label>
          <select id="source" name="source">
            <option value="">Choose one</option>
            <option value="linkedin">LinkedIn</option>
            <option value="referral">Referral</option>
          </select>

          <label>
            <input id="authorized" name="authorized" type="checkbox" value="yes" />
            I am authorized to work in the United States
          </label>

          <fieldset>
            <legend>Eligibility</legend>
            <p>Will you now or in the future require sponsorship?</p>
            <label><input type="radio" name="sponsorship" value="yes" /> Yes</label>
            <label><input type="radio" name="sponsorship" value="no" /> No</label>
          </fieldset>

          <input type="file" name="resume" />
          <input type="hidden" name="token" value="secret" />
          <button type="button">Continue</button>
          <button type="submit">Submit application</button>
        </form>
      </body>
    </html>`;
}
