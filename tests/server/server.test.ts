import { describe, expect, it } from "vitest";

import { loadServerListenOptions } from "../../apps/server/src/server.js";

describe("loadServerListenOptions", () => {
  it("uses local-only listen defaults", () => {
    expect(loadServerListenOptions({})).toEqual({
      host: "127.0.0.1",
      port: 4317
    });
  });

  it("accepts explicit host and port overrides", () => {
    expect(
      loadServerListenOptions({
        FAST_APP_HOST: "127.0.0.2",
        FAST_APP_PORT: "4321"
      })
    ).toEqual({
      host: "127.0.0.2",
      port: 4321
    });
  });

  it("rejects invalid port overrides", () => {
    expect(() =>
      loadServerListenOptions({
        FAST_APP_PORT: "70000"
      })
    ).toThrow("FAST_APP_PORT");
  });
});
