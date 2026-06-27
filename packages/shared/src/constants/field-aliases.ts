export const applicantProfileFieldKeys = [
  "fullName",
  "email",
  "phone",
  "location",
  "linkedinUrl",
  "portfolioUrl",
  "workAuthorization",
  "sponsorshipRequired",
  "defaultResumePath"
] as const;

export type ApplicantProfileFieldKey =
  (typeof applicantProfileFieldKeys)[number];

export const applicantProfileFieldAliases = {
  fullName: [
    "full name",
    "legal name",
    "your name",
    "applicant name",
    "name"
  ],
  email: [
    "email",
    "email address",
    "primary email",
    "contact email"
  ],
  phone: [
    "phone",
    "phone number",
    "mobile",
    "mobile number",
    "contact number",
    "telephone"
  ],
  location: [
    "location",
    "city",
    "current city",
    "city and state",
    "address",
    "current location"
  ],
  linkedinUrl: [
    "linkedin",
    "linkedin profile",
    "linkedin url",
    "linkedin profile url"
  ],
  portfolioUrl: [
    "portfolio",
    "portfolio url",
    "personal website",
    "website",
    "website url",
    "project website"
  ],
  workAuthorization: [
    "work authorization",
    "authorized to work",
    "employment eligibility",
    "legal authorization to work",
    "eligible to work"
  ],
  sponsorshipRequired: [
    "sponsorship required",
    "require sponsorship",
    "will you require sponsorship",
    "need visa sponsorship",
    "visa sponsorship"
  ],
  defaultResumePath: [
    "resume",
    "resume file",
    "resume path",
    "default resume",
    "resume upload"
  ]
} as const satisfies Record<ApplicantProfileFieldKey, readonly string[]>;

export const applicantProfileFieldAliasEntries = applicantProfileFieldKeys.map(
  (fieldKey) => ({
    fieldKey,
    aliases: applicantProfileFieldAliases[fieldKey]
  })
);
