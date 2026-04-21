export type RequestStatus = "pending" | "under_review" | "approved" | "rejected";
export type DocumentStatus = "uploaded" | "missing" | "reviewed";

export interface Student {
  id: string;
  fullName: string;
  country: string;
  intendedStudy?: string;
  university?: string;
  email?: string;
}

export interface Guardian {
  id: string;
  fullName: string;
  relationship: string;
  email?: string;
  phone?: string;
}

export interface BankAccount {
  id: string;
  accountNumber: string; // full; mask in UI
  branch: string;
  currency: string;
  holderName: string;
}

export interface VerificationDocument {
  id: string;
  name: string;
  type: string;
  status: DocumentStatus;
  uploadedAt?: string;
}

export interface ChecklistState {
  accountExists: boolean;
  belongsToGuardian: boolean;
  fundsSufficient: boolean;
  documentsVerified: boolean;
}

export interface HistoryEntry {
  id: string;
  actor: string;
  action: string;
  note?: string;
  timestamp: string;
}

export interface VerificationRequest {
  id: string;
  code: string; // VRF-XXXX
  student: Student;
  guardian: Guardian;
  account: BankAccount;
  requestedAmount: number;
  scholarshipAdjustedAmount?: number;
  currency: string;
  status: RequestStatus;
  submittedAt: string;
  decisionAt?: string;
  verifiedAmount?: number;
  rejectionReason?: string;
  documents: VerificationDocument[];
  checklist: ChecklistState;
  notes: HistoryEntry[];
  assignedTo?: string;
}

export interface Conversation {
  id: string;
  requestCode: string;
  studentName: string;
  subject: string;
  unread: number;
  lastMessageAt: string;
  messages: ConversationMessage[];
}

export interface ConversationMessage {
  id: string;
  from: "bank" | "student" | "system";
  authorName: string;
  body: string;
  timestamp: string;
}