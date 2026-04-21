// Admin portal domain types. Mirror these on the backend later.

export type UserRole = "student" | "university" | "bank" | "counselor" | "admin";
export type UserStatus = "active" | "suspended";

export type OrgType = "university" | "bank" | "school";

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "awaiting_verification"
  | "conditionally_admitted"
  | "admitted"
  | "rejected"
  | "missing_documents";

export type ApplicantType = "pre_approved" | "normal";
export type DecisionStatus = "pending" | "admitted" | "conditional" | "rejected";

export type VerificationStatus = "pending" | "under_review" | "approved" | "rejected" | "flagged";

export type DocumentStatus = "missing" | "under_review" | "completed" | "overdue";
export type DocumentSource = "student" | "counselor";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
  status: UserStatus;
  lastActive: string; // ISO
  country: string;
  avatarColor: string;
}

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  country: string;
}

export interface Application {
  id: string;
  studentId: string;
  universityId: string;
  program: string;
  status: ApplicationStatus;
  applicantType: ApplicantType;
  verificationStatus: VerificationStatus | "none";
  documentStatus: DocumentStatus;
  decisionStatus: DecisionStatus;
  submittedAt: string;
  updatedAt: string;
}

export interface Verification {
  id: string;
  code: string; // e.g. VER-2025-0001
  studentId: string;
  guardianName: string;
  bankId: string;
  requestedAmount: number;
  verifiedAmount: number | null;
  status: VerificationStatus;
  submittedAt: string;
  decidedAt: string | null;
}

export interface AdminDocument {
  id: string;
  studentId: string;
  type: string;
  uploadedBy: DocumentSource;
  universityId: string | null;
  status: DocumentStatus;
  updatedAt: string;
}

export type ActivityKind =
  | "application_submitted"
  | "verification_approved"
  | "verification_rejected"
  | "document_uploaded"
  | "user_suspended"
  | "user_activated"
  | "issue_flagged";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  message: string;
  actor: string;
  at: string;
}
