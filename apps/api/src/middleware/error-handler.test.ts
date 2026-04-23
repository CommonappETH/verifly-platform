import { describe, expect, test } from "bun:test";

import { createApp } from "../app";
import { NotFoundError } from "../lib/errors";

describe("error-handler", () => {
  test("AppError is serialized with code, message, request_id and correct status", async () => {
    const app = createApp({ env: "test" });
    app.get("/boom", () => {
      throw new NotFoundError("student");
    });

    const res = await app.request("/boom");
    expect(res.status).toBe(404);
    const body = (await res.json()) as {
      error: { code: string; message: string };
      request_id: string;
    };
    expect(body.error.code).toBe("not_found");
    expect(body.error.message).toBe("student not found");
    expect(body.request_id).toBeString();
    expect(body.request_id.length).toBeGreaterThan(0);
    expect(res.headers.get("X-Request-ID")).toBe(body.request_id);
  });

  test("unknown errors become 500 with generated request_id", async () => {
    const app = createApp({ env: "prod" });
    app.get("/kaboom", () => {
      throw new Error("oops");
    });

    const res = await app.request("/kaboom");
    expect(res.status).toBe(500);
    const body = (await res.json()) as {
      error: { code: string; message: string; stack?: string };
      request_id: string;
    };
    expect(body.error.code).toBe("internal_error");
    expect(body.error.stack).toBeUndefined();
    expect(body.request_id).toBeString();
  });
});
