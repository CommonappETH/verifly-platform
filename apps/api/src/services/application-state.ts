import type { ApplicationStatus, UserRole } from "../db/enums";
import { AppError } from "../lib/errors";

type Transition = {
  to: ApplicationStatus[];
  allowedRoles: UserRole[];
};

const TRANSITION_TABLE: Record<string, Transition> = {
  draft: { to: ["submitted"], allowedRoles: ["student"] },
  submitted: { to: ["under_review"], allowedRoles: ["university"] },
  under_review: {
    to: ["awaiting_info", "awaiting_verification", "committee_review"],
    allowedRoles: ["university"],
  },
  awaiting_info: { to: ["under_review"], allowedRoles: ["university", "student"] },
  awaiting_verification: { to: ["under_review"], allowedRoles: ["university"] },
  committee_review: {
    to: ["admitted", "rejected", "waitlisted", "conditionally_admitted"],
    allowedRoles: ["university"],
  },
};

export function validateTransition(
  currentStatus: ApplicationStatus,
  targetStatus: ApplicationStatus,
  actorRole: UserRole,
): void {
  const entry = TRANSITION_TABLE[currentStatus];
  if (!entry) {
    throw new AppError(409, "invalid_transition", `no transitions from status "${currentStatus}"`);
  }
  if (!entry.to.includes(targetStatus)) {
    throw new AppError(
      409,
      "invalid_transition",
      `cannot transition from "${currentStatus}" to "${targetStatus}"`,
    );
  }
  if (!entry.allowedRoles.includes(actorRole)) {
    throw new AppError(
      409,
      "invalid_transition",
      `role "${actorRole}" cannot transition from "${currentStatus}" to "${targetStatus}"`,
    );
  }
}
