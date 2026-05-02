// Phase 10.4 — wire→UI mapping seam for the university portal.
//
// Every value returned by `apiClient.*.*` passes through a function in this
// file before reaching components. Mapping functions stay pure — no React
// hooks, no fetching, no side effects.

import type { PublicUser, Student } from "@verifly/api-client";

// Backend's narrow ApplicationStatus set (matches apps/api/src/db/enums.ts).
// `@verifly/types`'s union is a wider superset that includes legacy values
// the backend doesn't accept; using the narrow set here gives us exhaustive
// switch/Record coverage and lets TypeScript catch typos.
export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "awaiting_info"
  | "awaiting_verification"
  | "committee_review"
  | "conditionally_admitted"
  | "admitted"
  | "rejected"
  | "waitlisted";

// Local wire shape — narrower than `@verifly/types`'s `Application` (which is a
// loose superset with timestamps typed as strings for legacy reasons). The
// real backend returns millis as numbers; the mapper boundary is the right
// place to absorb that drift until @verifly/types is tightened in a later
// phase.
export interface WireApplication {
  id: string;
  studentId: string;
  universityId: string;
  program: string | null;
  status: ApplicationStatus;
  verificationStatus: string | null;
  documentStatus: string | null;
  decisionStatus: string | null;
  applicantType: string | null;
  submittedAt: number | null;
  updatedAt: number;
}

// -------------------------------------------------------------------------
// Shared utilities
// -------------------------------------------------------------------------

const AVATAR_COLORS = [
  "#1e3a5f",
  "#5b3a8c",
  "#2d6a4f",
  "#9d4e15",
  "#7a1f3d",
  "#1f5673",
];

export function avatarColorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initialsFor(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function displayName(student: Student | undefined, fallback?: string): string {
  if (!student) return fallback ?? "Unknown applicant";
  return student.fullName || [student.firstName, student.lastName].filter(Boolean).join(" ") || fallback || student.id;
}

// -------------------------------------------------------------------------
// Applications list row — combines an Application with its (optional) Student
// -------------------------------------------------------------------------

export interface ApplicantRow {
  applicationId: string;
  studentId: string;
  universityId: string;
  name: string;
  initials: string;
  avatarColor: string;
  country: string | null;
  program: string | null;
  gpa: number | null;
  status: ApplicationStatus;
  submittedAt: number | null;
  updatedAt: number;
}

export function mapApplicationRow(
  application: WireApplication,
  student?: Student,
): ApplicantRow {
  const name = displayName(student, application.id);
  return {
    applicationId: application.id,
    studentId: application.studentId,
    universityId: application.universityId,
    name,
    initials: initialsFor(name),
    avatarColor: avatarColorFor(application.studentId),
    country: student?.country ?? null,
    program: application.program,
    gpa: typeof student?.gpa === "number" ? student.gpa : student?.gpa ? Number(student.gpa) : null,
    status: application.status,
    submittedAt: application.submittedAt,
    updatedAt: application.updatedAt,
  };
}

// -------------------------------------------------------------------------
// Applicant detail — richer view stitched from application + student
// -------------------------------------------------------------------------

export interface ApplicantDetail extends ApplicantRow {
  email: string | null;
  nationality: string | null;
  intendedStudy: string | null;
}

export function mapApplicantDetail(
  application: WireApplication,
  student?: Student,
  studentUser?: PublicUser,
): ApplicantDetail {
  return {
    ...mapApplicationRow(application, student),
    email: studentUser?.email ?? null,
    nationality: student?.nationality ?? null,
    intendedStudy: student?.intendedStudy ?? null,
  };
}

// -------------------------------------------------------------------------
// Status display labels — keep all 10 application statuses with friendly text
// -------------------------------------------------------------------------

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  awaiting_info: "Awaiting Info",
  awaiting_verification: "Awaiting Verification",
  committee_review: "Committee Review",
  conditionally_admitted: "Conditional Admit",
  admitted: "Admitted",
  rejected: "Rejected",
  waitlisted: "Waitlisted",
};

export const APPLICATION_STATUS_TONE: Record<ApplicationStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-primary-soft text-primary",
  under_review: "bg-info/15 text-info-foreground",
  awaiting_info: "bg-warning/15 text-warning-foreground",
  awaiting_verification: "bg-warning/15 text-warning-foreground",
  committee_review: "bg-accent/20 text-accent-foreground",
  conditionally_admitted: "bg-accent/30 text-accent-foreground",
  admitted: "bg-success/20 text-success-foreground",
  rejected: "bg-destructive/15 text-destructive",
  waitlisted: "bg-muted text-muted-foreground",
};

// Maps an ApplicationStatus to the corresponding "decision-style" view used
// by the decisions page. Until the backend has a separate decision_status
// column populated, the application status is the source of truth.
export type DecisionView = "admit" | "conditional_admit" | "waitlist" | "reject" | "pending";

export function decisionFromStatus(status: ApplicationStatus): DecisionView {
  switch (status) {
    case "admitted":
      return "admit";
    case "conditionally_admitted":
      return "conditional_admit";
    case "waitlisted":
      return "waitlist";
    case "rejected":
      return "reject";
    default:
      return "pending";
  }
}

export const DECISION_LABEL: Record<DecisionView, string> = {
  admit: "Admit",
  conditional_admit: "Conditional Admit",
  waitlist: "Waitlist",
  reject: "Reject",
  pending: "Pending",
};

export const DECISION_TONE: Record<DecisionView, string> = {
  admit: "bg-success/20 text-success-foreground",
  conditional_admit: "bg-accent/30 text-accent-foreground",
  waitlist: "bg-muted text-muted-foreground",
  reject: "bg-destructive/15 text-destructive",
  pending: "bg-muted text-muted-foreground",
};
