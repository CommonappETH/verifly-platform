import { createVeriflyClient, type VeriflyClient } from "@verifly/api-client";

// Phase 10.3: one typed API client per app, built from the shared
// @verifly/api-client package. Reads VITE_API_BASE_URL at build time; Vite
// inlines this as a static string so the client never sees `process.env`.
//
// The client is constructed once at module load. The 401 interceptor is
// installed via `setOnUnauthorized` from inside `<AuthProvider>` so that
// the redirect target uses the same router instance the app already mounts.
// Without that hook, a 401 on a non-auth route would surface as a thrown
// ApiError and force every protected route to write its own catch.
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

export const apiClient: VeriflyClient = createVeriflyClient({ baseUrl });
