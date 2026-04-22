// Canonical status unions. All values are snake_case (see learningguide.md §6).

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "awaiting_info"
  | "awaiting_verification"
  | "committee_review"
  | "conditionally_admitted"
  | "conditionally_accepted"
  | "accepted"
  | "admitted"
  | "rejected"
  | "waitlisted"
  | "missing_documents"
  | "not_started"
  | "in_progress"
  | "complete";

export type VerificationStatus =
  | "not_started"
  | "pending"
  | "pending_submission"
  | "under_review"
  | "in_review"
  | "more_info_needed"
  | "pre_verified"
  | "verified"
  | "approved"
  | "rejected"
  | "failed"
  | "flagged"
  | "none";

export type DocumentStatus =
  | "missing"
  | "uploaded"
  | "under_review"
  | "needs_replacement"
  | "approved"
  | "completed"
  | "overdue"
  | "reviewed";

export type UserRole =
  | "student"
  | "university"
  | "bank"
  | "counselor"
  | "admin";

export type ApplicantType = "pre_approved" | "normal";

export type DecisionStatus =
  | "none"
  | "pending"
  | "admit"
  | "admitted"
  | "conditional_admit"
  | "conditional"
  | "waitlist"
  | "rejected"
  | "reject";
