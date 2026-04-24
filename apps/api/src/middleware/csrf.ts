import { getCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono";

import { ForbiddenError } from "../lib/errors";

export const CSRF_COOKIE = "csrf";
export const CSRF_HEADER = "x-csrf-token";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export interface CsrfOptions {
  isPublic?: (path: string, method: string) => boolean;
}

export const csrf = (options: CsrfOptions = {}): MiddlewareHandler => async (c, next) => {
  if (!MUTATING.has(c.req.method)) return next();
  if (options.isPublic?.(c.req.path, c.req.method)) return next();
  const cookie = getCookie(c, CSRF_COOKIE);
  const header = c.req.header(CSRF_HEADER) ?? c.req.header(CSRF_HEADER.toUpperCase());
  if (!cookie || !header || cookie !== header) {
    throw new ForbiddenError("csrf token mismatch", { code: "csrf_failed" });
  }
  await next();
};

export function generateCsrfToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Buffer.from(bytes).toString("base64url");
}
