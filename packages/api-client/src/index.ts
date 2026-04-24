export { createClient } from "./client";
export type { ApiClient, ClientOptions, RequestOptions } from "./client";

export { ApiError, NetworkError } from "./errors";
export type { ErrorCode, ApiErrorBody } from "./errors";

export * from "./types";
export * from "./endpoints";

import { createClient } from "./client";
import type { ApiClient } from "./client";
import { authEndpoints } from "./endpoints/auth";
import { studentEndpoints } from "./endpoints/students";
import { applicationEndpoints } from "./endpoints/applications";
import { verificationEndpoints } from "./endpoints/verifications";
import { documentEndpoints } from "./endpoints/documents";
import { userEndpoints } from "./endpoints/users";
import { organizationEndpoints } from "./endpoints/organizations";
import { portalEndpoints } from "./endpoints/portal";

export interface VeriflyClient extends ApiClient {
  auth: ReturnType<typeof authEndpoints>;
  students: ReturnType<typeof studentEndpoints>;
  applications: ReturnType<typeof applicationEndpoints>;
  verifications: ReturnType<typeof verificationEndpoints>;
  documents: ReturnType<typeof documentEndpoints>;
  users: ReturnType<typeof userEndpoints>;
  organizations: ReturnType<typeof organizationEndpoints>;
  portal: ReturnType<typeof portalEndpoints>;
}

/**
 * Creates a fully-typed Verifly API client with per-domain endpoint groups.
 * CSRF token is auto-injected from the `csrf` cookie on mutating requests.
 */
export function createVeriflyClient(options: { baseUrl: string }): VeriflyClient {
  const base = createClient({ baseUrl: options.baseUrl, credentials: "include" });

  return Object.assign(base, {
    auth: authEndpoints(base),
    students: studentEndpoints(base),
    applications: applicationEndpoints(base),
    verifications: verificationEndpoints(base),
    documents: documentEndpoints(base),
    users: userEndpoints(base),
    organizations: organizationEndpoints(base),
    portal: portalEndpoints(base),
  });
}
