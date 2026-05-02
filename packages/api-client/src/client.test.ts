import { afterEach, describe, expect, mock, test } from "bun:test";

import { createClient } from "./client";

const origFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = origFetch;
});

function stubFetch(handler: (req: Request) => Response | Promise<Response>): void {
  globalThis.fetch = mock((input: Request | string | URL, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(input, init);
    return Promise.resolve(handler(req));
  }) as typeof fetch;
}

describe("createClient — 401 interceptor", () => {
  test("calls onUnauthorized when a non-auth route returns 401", async () => {
    const onUnauthorized = mock(() => {});
    stubFetch(() =>
      new Response(JSON.stringify({ error: { code: "unauthorized", message: "no" } }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );

    const c = createClient({ baseUrl: "http://api.test", onUnauthorized });
    await expect(c.get("/students")).rejects.toThrow();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  test("skips onUnauthorized for /auth/* paths", async () => {
    const onUnauthorized = mock(() => {});
    stubFetch(() =>
      new Response(JSON.stringify({ error: { code: "unauthorized", message: "no" } }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );

    const c = createClient({ baseUrl: "http://api.test", onUnauthorized });
    await expect(c.post("/auth/login", { email: "a@b.test", password: "x" })).rejects.toThrow();
    expect(onUnauthorized).toHaveBeenCalledTimes(0);
  });

  test("skips onUnauthorized when skipUnauthorizedHandler is true", async () => {
    const onUnauthorized = mock(() => {});
    stubFetch(() =>
      new Response(JSON.stringify({ error: { code: "unauthorized", message: "no" } }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );

    const c = createClient({ baseUrl: "http://api.test", onUnauthorized });
    await expect(c.get("/students", { skipUnauthorizedHandler: true })).rejects.toThrow();
    expect(onUnauthorized).toHaveBeenCalledTimes(0);
  });

  test("setOnUnauthorized replaces the handler at runtime", async () => {
    const initial = mock(() => {});
    const replaced = mock(() => {});
    stubFetch(() =>
      new Response(JSON.stringify({ error: { code: "unauthorized", message: "no" } }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );

    const c = createClient({ baseUrl: "http://api.test", onUnauthorized: initial });
    c.setOnUnauthorized(replaced);
    await expect(c.get("/students")).rejects.toThrow();
    expect(initial).toHaveBeenCalledTimes(0);
    expect(replaced).toHaveBeenCalledTimes(1);
  });

  test("does not fire on 2xx responses", async () => {
    const onUnauthorized = mock(() => {});
    stubFetch(() =>
      new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const c = createClient({ baseUrl: "http://api.test", onUnauthorized });
    await c.get("/students");
    expect(onUnauthorized).toHaveBeenCalledTimes(0);
  });
});
