// Admin portal view models. Enum unions come from @verifly/types.

import type {
  ApplicantType,
  ApplicationStatus,
  DecisionStatus,
  DocumentStatus,
  UserRole,
  VerificationStatus,
} from "@verifly/types";

export type {
  ApplicantType,
  ApplicationStatus,
  DecisionStatus,
  DocumentStatus,
  UserRole,
  VerificationStatus,
};

export type UserStatus = "active" | "suspended";

export type OrgType = "university" | "bank" | "school";

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
