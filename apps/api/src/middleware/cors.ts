import { cors as honoCors } from "hono/cors";
import type { MiddlewareHandler } from "hono";

// Phase 11.1 pulled forward to Phase 10: each frontend makes cross-origin
// fetches to the API during local dev, so CORS with credentials has to be in
// place before we can swap mocks for real calls. Origins come from the
// ALLOWED_ORIGINS env var (comma-separated); the frontends' dev URLs are
// pre-populated in apps/api/.env.example.
//
// Notes on the config:
// - `credentials: true` is required because auth runs on HttpOnly cookies.
// - Echoing the request origin (as a function) — not "*" — is mandatory when
//   credentials are in play; browsers reject wildcard + cookies.
// - `X-CSRF-Token` must be in allowedHeaders so the api-client can send it.
// - `X-Request-ID` is exposed so the frontend can correlate errors with
//   server logs (structured log middleware already emits request_id).
export function cors(allowedOrigins: string[]): MiddlewareHandler {
  const allowSet = new Set(allowedOrigins.map((o) => o.trim()).filter(Boolean));

  return honoCors({
    origin: (origin) => {
      if (!origin) return "";
      return allowSet.has(origin) ? origin : "";
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "X-CSRF-Token", "X-Request-ID"],
    exposeHeaders: ["X-Request-ID"],
    maxAge: 600,
  });
}

export function parseAllowedOrigins(raw: string): string[] {
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}
