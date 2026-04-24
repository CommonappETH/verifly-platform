import { describe, expect, test } from "bun:test";

import { createApp } from "../app";
import { createTestHarness } from "../testing/harness";

describe("CORS middleware (Phase 11.1 pulled forward)", () => {
  function buildApp(allowedOrigins: string) {
    const h = createTestHarness();
    return {
      h,
      app: createApp({
        env: "test",
        allowedOrigins,
        createCtx: ({ requestId }) => ({ ...h.ctx, requestId }),
      }),
    };
  }

  test("echoes allowed origin + credentials on preflight", async () => {
    const { app, h } = buildApp("http://localhost:5173");
    const res = await app.request(
      new Request("http://local/health", {
        method: "OPTIONS",
        headers: {
          origin: "http://localhost:5173",
          "access-control-request-method": "GET",
          "access-control-request-headers": "x-csrf-token",
        },
      }),
    );
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:5173");
    expect(res.headers.get("access-control-allow-credentials")).toBe("true");
    expect(res.headers.get("access-control-allow-headers")?.toLowerCase()).toContain(
      "x-csrf-token",
    );
    h.cleanup();
  });

  test("omits allow-origin for a disallowed origin", async () => {
    const { app, h } = buildApp("http://localhost:5173");
    const res = await app.request(
      new Request("http://local/health", {
        headers: { origin: "http://evil.example" },
      }),
    );
    // Hono's cors returns no allow-origin header when the function returns "".
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
    h.cleanup();
  });

  test("same-origin fetch (no Origin header) is unaffected", async () => {
    const { app, h } = buildApp("http://localhost:5173");
    const res = await app.request(new Request("http://local/health"));
    expect(res.status).toBe(200);
    h.cleanup();
  });
});
