import { describe, expect, it } from "vitest";

import { workspaceStatus } from "../../packages/shared/src/index.js";

describe("workspace foundation", () => {
  it("exposes the shared placeholder contract", () => {
    expect(workspaceStatus).toEqual({
      phase: "phase-1-foundation",
      ready: true
    });
  });
});
