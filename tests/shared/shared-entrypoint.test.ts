import { describe, expect, it } from "vitest";

import * as shared from "../../packages/shared/src/index.js";

describe("shared package entry point", () => {
  it("exposes the intended Phase 2 shared contract surface", () => {
    expect(shared.applicantProfileSchema).toBeDefined();
    expect(shared.learnedAnswerSchema).toBeDefined();
    expect(shared.applicationRunSchema).toBeDefined();
    expect(shared.promptSchema).toBeDefined();
    expect(shared.runEventSchema).toBeDefined();
    expect(shared.createRunRequestSchema).toBeDefined();
    expect(shared.updateProfileRequestSchema).toBeDefined();
    expect(shared.listMemoryResponseSchema).toBeDefined();
    expect(shared.respondToPromptRequestSchema).toBeDefined();
    expect(shared.applicantProfileFieldAliases).toBeDefined();
    expect(shared.normalizeLabel).toBeDefined();
    expect(shared.normalizeHostname).toBeDefined();
  });
});
