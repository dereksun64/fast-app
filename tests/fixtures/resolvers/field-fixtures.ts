import type { FieldDescriptor } from "../../../apps/server/src/resolvers/index.js";

export const commonApplicationFields = {
  firstName: {
    label: "First name",
    controlType: "text",
    pageHost: "jobs.example.com",
    pagePath: "/apply"
  },
  fullName: {
    label: "Full name",
    controlType: "text",
    pageHost: "jobs.example.com",
    pagePath: "/apply"
  },
  email: {
    label: "Email address",
    controlType: "text",
    pageHost: "jobs.example.com",
    pagePath: "/apply"
  },
  workAuthorization: {
    label: "Are you authorized to work in the United States?",
    controlType: "radio",
    pageHost: "jobs.example.com",
    pagePath: "/apply",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" }
    ]
  },
  sponsorship: {
    label: "Will you require sponsorship?",
    controlType: "radio",
    pageHost: "jobs.example.com",
    pagePath: "/apply",
    options: [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" }
    ]
  }
} as const satisfies Record<string, FieldDescriptor>;

export const ambiguousApplicationFields = {
  openEnded: {
    label: "Why are you interested in this role?",
    controlType: "textarea",
    pageHost: "jobs.example.com",
    pagePath: "/apply",
    nearbyContext: "Application questions"
  },
  unlabeledText: {
    label: "",
    controlType: "text",
    pageHost: "jobs.example.com",
    pagePath: "/apply"
  },
  radioWithoutOptions: {
    label: "Select your work authorization status",
    controlType: "radio",
    pageHost: "jobs.example.com",
    pagePath: "/apply"
  },
  unclearSelect: {
    label: "Source",
    controlType: "select",
    pageHost: "jobs.example.com",
    pagePath: "/apply",
    options: [
      { label: "Friend" },
      { label: "Search" },
      { label: "Other" }
    ]
  }
} as const satisfies Record<string, FieldDescriptor>;
