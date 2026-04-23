// Canonical backend enum tuples. These are the exact string values the DB
// CHECK constraints and Zod service-layer schemas both accept. They are
// intentionally a narrower, normalised subset of the superset in
// `@verifly/types` (which still carries historical frontend drift that
// Phase 10 will tighten up).
//
// namingconventions.md §2.7: `as const` tuple + union type derived from it.
// Never TypeScript `enum`.

export const userRoles = [
  "admin",
  "student",
  "counselor",
  "bank",
  "university",
] as const;
export type UserRole = (typeof userRoles)[number];

export const organizationKinds = ["university", "bank"] as const;
export type OrganizationKind = (typeof organizationKinds)[number];

export const applicationStatuses = [
  "draft",
  "submitted",
  "under_review",
  "awaiting_info",
  "awaiting_verification",
  "committee_review",
  "conditionally_admitted",
  "admitted",
  "rejected",
  "waitlisted",
] as const;
export type ApplicationStatus = (typeof applicationStatuses)[number];

export const verificationStatuses = [
  "pending",
  "under_review",
  "more_info_needed",
  "verified",
  "rejected",
] as const;
export type VerificationStatus = (typeof verificationStatuses)[number];

export const documentStatuses = [
  "missing",
  "uploaded",
  "under_review",
  "approved",
  "needs_replacement",
] as const;
export type DocumentStatus = (typeof documentStatuses)[number];

export const decisionStatuses = [
  "none",
  "pending",
  "admit",
  "conditional_admit",
  "waitlist",
  "reject",
] as const;
export type DecisionStatus = (typeof decisionStatuses)[number];

export const applicantTypes = ["pre_approved", "normal"] as const;
export type ApplicantType = (typeof applicantTypes)[number];

export const documentKinds = [
  "transcript",
  "passport",
  "test_score",
  "recommendation_letter",
  "school_profile",
  "mid_year_report",
  "bank_statement",
  "sponsor_letter",
  "scholarship_letter",
  "academic_record",
  "other",
] as const;
export type DocumentKind = (typeof documentKinds)[number];
