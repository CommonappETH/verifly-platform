// Phase 10.4 — wire→UI mapping seam for the bank portal.
//
// Every value returned by `apiClient.*.*` passes through a function in this
// file before reaching components.

import type { PublicUser, Student } from "@verifly/api-client";
import type { StatusBadgeProps, StatusBadgeTone } from "@verifly/ui";

// Backend's narrow VerificationStatus (matches apps/api/src/db/enums.ts).
// `@verifly/types`'s union is a wider superset including legacy values the
// backend doesn't accept; the narrow set keeps `Record<…, …>` exhaustive.
export type VerificationStatus =
  | "pending_submission"
  | "pending"
  | "under_review"
  | "more_info_needed"
  | "verified"
  | "rejected";

// Local wire shape — matches the actual API JSON; @verifly/types's
// `Verification` is a loose superset for legacy reasons.
export interface WireVerification {
  id: string;
  code: string;
  studentId: string;
  applicationId: string | null;
  bankId: string | null;
  guardianId: string | null;
  requestedAmount: number;
  verifiedAmount: number | null;
  currency: string;
  status: VerificationStatus;
  rejectionReason: string | null;
  submittedAt: number | null;
  decidedAt: number | null;
  verifiedAt: number | null;
}

// -------------------------------------------------------------------------
// Status display
// -------------------------------------------------------------------------

export const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
  pending_submission: "Pending Submission",
  pending: "Pending",
  under_review: "Under Review",
  more_info_needed: "More Info Needed",
  verified: "Approved",
  rejected: "Rejected",
};

export const VERIFICATION_STATUS_TONE: Record<VerificationStatus, StatusBadgeTone> = {
  pending_submission: "warning",
  pending: "warning",
  under_review: "info",
  more_info_needed: "warning",
  verified: "success",
  rejected: "destructive",
};

export function verificationStatusBadge(
  status: VerificationStatus,
): Pick<StatusBadgeProps, "label" | "tone"> {
  return {
    label: VERIFICATION_STATUS_LABEL[status],
    tone: VERIFICATION_STATUS_TONE[status],
  };
}

// "Decided" = bank issued a final decision. "Pending" buckets are everything
// before that.
export function isDecided(status: VerificationStatus): boolean {
  return status === "verified" || status === "rejected";
}

export function isPendingForBank(status: VerificationStatus): boolean {
  return status === "pending" || status === "under_review" || status === "more_info_needed";
}

// -------------------------------------------------------------------------
// List / detail rows
// -------------------------------------------------------------------------

export interface VerificationRow {
  id: string;
  code: string;
  studentId: string;
  studentName: string;
  studentCountry: string | null;
  applicationId: string | null;
  guardianId: string | null;
  requestedAmount: number;
  verifiedAmount: number | null;
  currency: string;
  status: VerificationStatus;
  submittedAt: number | null;
  decidedAt: number | null;
  rejectionReason: string | null;
}

export function mapVerificationRow(
  v: WireVerification,
  student?: Student,
): VerificationRow {
  return {
    id: v.id,
    code: v.code,
    studentId: v.studentId,
    studentName: displayName(student, v.studentId),
    studentCountry: student?.country ?? null,
    applicationId: v.applicationId,
    guardianId: v.guardianId,
    requestedAmount: v.requestedAmount,
    verifiedAmount: v.verifiedAmount,
    currency: v.currency,
    status: v.status,
    submittedAt: v.submittedAt,
    decidedAt: v.decidedAt,
    rejectionReason: v.rejectionReason,
  };
}

export interface VerificationDetail extends VerificationRow {
  studentEmail: string | null;
  studentNationality: string | null;
  studentIntendedStudy: string | null;
  studentGpa: number | null;
}

export function mapVerificationDetail(
  v: WireVerification,
  student?: Student,
  studentUser?: PublicUser,
): VerificationDetail {
  return {
    ...mapVerificationRow(v, student),
    studentEmail: studentUser?.email ?? null,
    studentNationality: student?.nationality ?? null,
    studentIntendedStudy: student?.intendedStudy ?? null,
    studentGpa:
      typeof student?.gpa === "number"
        ? student.gpa
        : student?.gpa
        ? Number(student.gpa)
        : null,
  };
}

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

export function displayName(student: Student | undefined, fallback: string): string {
  if (!student) return fallback;
  return (
    student.fullName ||
    [student.firstName, student.lastName].filter(Boolean).join(" ") ||
    fallback
  );
}

export function formatCurrency(amount: number, currency = "USD"): string {
  // Backend stores minor units (e.g. cents). Convert to whole-currency for UI.
  const major = amount / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(major);
}

export function formatDate(ms: number | null | undefined): string {
  if (ms == null) return "—";
  const d = new Date(ms);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(ms: number | null | undefined): string {
  if (ms == null) return "—";
  const d = new Date(ms);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
