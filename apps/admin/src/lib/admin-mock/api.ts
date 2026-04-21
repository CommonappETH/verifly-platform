// Thin async API layer. Swap these with real fetch calls later — the rest of the
// admin portal imports only from this file for data.

import { users } from "./users";
import { organizations } from "./organizations";
import { applications } from "./applications";
import { verifications } from "./verifications";
import { adminDocuments } from "./documents";
import { activity } from "./activity";
import * as analytics from "./analytics";
import type { AdminUser, Organization, Application, Verification, AdminDocument, ActivityEvent } from "./types";

const wait = <T,>(v: T) => Promise.resolve(v);

export const adminApi = {
  listUsers: (): Promise<AdminUser[]> => wait(users),
  listOrganizations: (): Promise<Organization[]> => wait(organizations),
  listApplications: (): Promise<Application[]> => wait(applications),
  listVerifications: (): Promise<Verification[]> => wait(verifications),
  listDocuments: (): Promise<AdminDocument[]> => wait(adminDocuments),
  listActivity: (): Promise<ActivityEvent[]> => wait(activity),
  analytics: () => wait(analytics),
};

// Synchronous lookup helpers (we already have everything in memory).
export function getOrgById(id: string | null): Organization | undefined {
  if (!id) return undefined;
  return organizations.find((o) => o.id === id);
}
export function getUserById(id: string): AdminUser | undefined {
  return users.find((u) => u.id === id);
}
