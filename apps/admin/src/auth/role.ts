// Phase 10.4 — the role this portal accepts. The login form refuses to keep
// a session whose role doesn't match. Backend `/auth/login` is role-agnostic,
// so the gate has to live here on the client.
import type { UserRole } from "@verifly/api-client";

export const EXPECTED_ROLE: UserRole = "admin";

export const PORTAL_NAME = "Admin Portal";
