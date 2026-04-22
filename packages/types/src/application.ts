import type {
  ApplicantType,
  ApplicationStatus,
  DecisionStatus,
  DocumentStatus,
  VerificationStatus,
} from "./status";

// Superset of fields any portal app uses. All non-identity fields are optional
// so apps consume only what they need.
export interface Application {
  id: string;
  studentId?: string;
  universityId?: string;
  universityName?: string;
  program?: string;
  status: ApplicationStatus;
  verificationStatus?: VerificationStatus;
  documentStatus?: DocumentStatus;
  decisionStatus?: DecisionStatus;
  applicantType?: ApplicantType;
  submittedAt?: string;
  submittedDate?: string | null;
  updatedAt?: string;
  lastUpdated?: string;
}
