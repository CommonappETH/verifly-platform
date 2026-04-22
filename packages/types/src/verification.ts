import type { VerificationStatus } from "./status";

// Canonical verification shape. Superset of VerificationRequest (bank),
// Verification (admin), and FinancialVerification (university).
export interface Verification {
  id: string;
  code?: string;
  studentId?: string;
  guardianName?: string;
  bankId?: string;
  partnerBank?: string;
  requestedAmount?: number;
  verifiedAmount?: number | null;
  currency?: string;
  status: VerificationStatus;
  submittedAt?: string;
  decidedAt?: string | null;
  decisionAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}
