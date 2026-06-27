import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);
const optionalUrl = z.string().trim().url().optional();

export const applicantProfileSchema = z.object({
  fullName: nonEmptyString,
  email: z.string().trim().email(),
  phone: nonEmptyString,
  location: nonEmptyString,
  linkedinUrl: optionalUrl,
  portfolioUrl: optionalUrl,
  workAuthorization: nonEmptyString,
  sponsorshipRequired: z.boolean(),
  defaultResumePath: nonEmptyString.optional()
});

export type ApplicantProfile = z.infer<typeof applicantProfileSchema>;
