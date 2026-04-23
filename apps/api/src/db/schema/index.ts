// Barrel re-export of every Drizzle table plus a `schema` object for
// `drizzle(sqlite, { schema })` to pick up relations and types.
// namingconventions.md §1.6: `index.ts` is for barrel re-exports only.

export { applications } from "./applications";
export { auditLog } from "./audit_log";
export { bankUsers } from "./bank_users";
export { counselors } from "./counselors";
export { documents } from "./documents";
export { guardians } from "./guardians";
export { organizations } from "./organizations";
export { passwordResets } from "./password_resets";
export { rateLimits } from "./rate_limits";
export { sessions } from "./sessions";
export { students } from "./students";
export { universityUsers } from "./university_users";
export { users } from "./users";
export { verifications } from "./verifications";

import { applications } from "./applications";
import { auditLog } from "./audit_log";
import { bankUsers } from "./bank_users";
import { counselors } from "./counselors";
import { documents } from "./documents";
import { guardians } from "./guardians";
import { organizations } from "./organizations";
import { passwordResets } from "./password_resets";
import { rateLimits } from "./rate_limits";
import { sessions } from "./sessions";
import { students } from "./students";
import { universityUsers } from "./university_users";
import { users } from "./users";
import { verifications } from "./verifications";

export const schema = {
  applications,
  auditLog,
  bankUsers,
  counselors,
  documents,
  guardians,
  organizations,
  passwordResets,
  rateLimits,
  sessions,
  students,
  universityUsers,
  users,
  verifications,
} as const;
