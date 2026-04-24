import { createVeriflyClient, type VeriflyClient } from "@verifly/api-client";

// Phase 10: one typed API client per app, built from the shared
// @verifly/api-client package. Reads VITE_API_BASE_URL at build time; the
// Vite dev server and build both inline this as a static string so the
// client never sees a `process.env` reference.
//
// CSRF tokens are read from the `csrf` cookie by the underlying client on
// mutating requests, and `credentials: "include"` makes the browser send
// the `sid` HttpOnly cookie. See apps/api/src/middleware/cors.ts for the
// matching `credentials: true` wiring.
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

export const apiClient: VeriflyClient = createVeriflyClient({ baseUrl });
