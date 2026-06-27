import { describe, expect, it } from "vitest";

import { applicantProfileSchema } from "../../packages/shared/src/index.js";

describe("applicantProfileSchema", () => {
  it("accepts a complete profile with optional URLs and resume path", () => {
    const profile = applicantProfileSchema.parse({
      fullName: "  Ada Lovelace  ",
      email: "  ada@example.com  ",
      phone: "  +1 555 0100  ",
      location: "  New York, NY  ",
      linkedinUrl: "https://www.linkedin.com/in/ada-lovelace",
      portfolioUrl: "https://ada.example.dev",
      workAuthorization: "US citizen",
      sponsorshipRequired: false,
      defaultResumePath: "  data/resumes/ada.pdf  "
    });

    expect(profile).toEqual({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+1 555 0100",
      location: "New York, NY",
      linkedinUrl: "https://www.linkedin.com/in/ada-lovelace",
      portfolioUrl: "https://ada.example.dev",
      workAuthorization: "US citizen",
      sponsorshipRequired: false,
      defaultResumePath: "data/resumes/ada.pdf"
    });
  });

  it("accepts a profile without optional URLs or a resume path", () => {
    const result = applicantProfileSchema.parse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+1 555 0100",
      location: "New York, NY",
      workAuthorization: "US citizen",
      sponsorshipRequired: false
    });

    expect(result.linkedinUrl).toBeUndefined();
    expect(result.portfolioUrl).toBeUndefined();
    expect(result.defaultResumePath).toBeUndefined();
  });

  it("rejects missing required fields", () => {
    const parsed = applicantProfileSchema.safeParse({
      email: "ada@example.com",
      phone: "+1 555 0100",
      location: "New York, NY",
      workAuthorization: "US citizen",
      sponsorshipRequired: false
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects malformed optional URLs", () => {
    const parsed = applicantProfileSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+1 555 0100",
      location: "New York, NY",
      linkedinUrl: "not-a-url",
      workAuthorization: "US citizen",
      sponsorshipRequired: false
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects impossible primitive types", () => {
    const parsed = applicantProfileSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+1 555 0100",
      location: "New York, NY",
      workAuthorization: "US citizen",
      sponsorshipRequired: "no"
    });

    expect(parsed.success).toBe(false);
  });
});
