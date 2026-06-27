import { describe, expect, it } from "vitest";

import {
  applicantProfileFieldAliasEntries,
  applicantProfileFieldAliases,
  applicantProfileFieldKeys
} from "../../packages/shared/src/index.js";

describe("applicantProfileFieldKeys", () => {
  it("lists the canonical applicant profile fields covered by alias matching", () => {
    expect(applicantProfileFieldKeys).toEqual([
      "fullName",
      "email",
      "phone",
      "location",
      "linkedinUrl",
      "portfolioUrl",
      "workAuthorization",
      "sponsorshipRequired",
      "defaultResumePath"
    ]);
  });
});

describe("applicantProfileFieldAliases", () => {
  it("includes common aliases for the most important autofill fields", () => {
    expect(applicantProfileFieldAliases.fullName).toContain("full name");
    expect(applicantProfileFieldAliases.email).toContain("email address");
    expect(applicantProfileFieldAliases.phone).toContain("phone number");
    expect(applicantProfileFieldAliases.location).toContain("city");
    expect(applicantProfileFieldAliases.linkedinUrl).toContain("linkedin profile");
    expect(applicantProfileFieldAliases.portfolioUrl).toContain("website");
    expect(applicantProfileFieldAliases.workAuthorization).toContain(
      "authorized to work"
    );
    expect(applicantProfileFieldAliases.sponsorshipRequired).toContain(
      "require sponsorship"
    );
  });

  it("keeps aliases lowercase so later normalized matching stays simple", () => {
    const allAliases = Object.values(applicantProfileFieldAliases).flat();

    expect(allAliases.every((alias) => alias === alias.toLowerCase())).toBe(
      true
    );
  });
});

describe("applicantProfileFieldAliasEntries", () => {
  it("provides a resolver-friendly entry list with keys and aliases", () => {
    expect(applicantProfileFieldAliasEntries).toEqual(
      applicantProfileFieldKeys.map((fieldKey) => ({
        fieldKey,
        aliases: applicantProfileFieldAliases[fieldKey]
      }))
    );
  });
});
