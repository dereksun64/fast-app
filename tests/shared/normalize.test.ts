import { describe, expect, it } from "vitest";

import {
  normalizeHostname,
  normalizeLabel,
  normalizeNearbyContext,
  normalizeWhitespace,
  stripPunctuation
} from "../../packages/shared/src/index.js";

describe("normalizeWhitespace", () => {
  it("trims and collapses repeated whitespace", () => {
    expect(normalizeWhitespace("  Ada   Lovelace \n\t profile  ")).toBe(
      "Ada Lovelace profile"
    );
  });
});

describe("stripPunctuation", () => {
  it("replaces punctuation with spaces without removing letters or numbers", () => {
    expect(stripPunctuation("Work-Authorization? (US only)")).toBe(
      "Work Authorization   US only "
    );
  });
});

describe("normalizeLabel", () => {
  it("lowercases, strips punctuation, and collapses whitespace", () => {
    expect(normalizeLabel("  LinkedIn Profile URL:  ")).toBe(
      "linkedin profile url"
    );
  });

  it("normalizes common question-like labels for matching", () => {
    expect(normalizeLabel("Are you legally authorized to work in the U.S.?")).toBe(
      "are you legally authorized to work in the u s"
    );
  });
});

describe("normalizeHostname", () => {
  it("lowercases, trims, and removes trailing dots", () => {
    expect(normalizeHostname("  JOBS.EXAMPLE.COM.  ")).toBe("jobs.example.com");
  });
});

describe("normalizeNearbyContext", () => {
  it("cleans nearby context into a stable comparison string", () => {
    expect(
      normalizeNearbyContext("  Employment eligibility / sponsorship details: ")
    ).toBe("employment eligibility sponsorship details");
  });
});
