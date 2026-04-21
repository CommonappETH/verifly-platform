// Shared domain types — designed for future backend integration.

export type ApplicantType = "pre-approved" | "normal";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under-review"
  | "awaiting-info"
  | "awaiting-verification"
  | "committee-review"
  | "conditionally-admitted"
  | "admitted"
  | "rejected"
  | "waitlisted";

export type VerificationStatus = "verified" | "pending" | "in-review" | "not-started" | "failed";
export type VerificationTiming = "pre-application" | "post-application" | "post-admission";
export type DecisionStatus = "none" | "admit" | "conditional-admit" | "waitlist" | "reject";

export interface FinancialVerification {
  verificationId: string;
  amountRequested: number; // USD
  currency: string;
  status: VerificationStatus;
  timing: VerificationTiming;
  partnerBank: string;
  partnerBankStatus: "connected" | "pending" | "failed";
  preApprovedBeforeApplying: boolean;
  verifiedAt?: string;
}

export interface ScholarshipInfo {
  estimatedAmount: number;
  tuitionAdjustment: number;
  netVerificationAmount: number;
  reviewStatus: "none" | "proposed" | "approved" | "declined";
  notes?: string;
}

export interface Essay {
  id: string;
  prompt: string;
  wordCount: number;
  content: string;
}

export interface Document {
  id: string;
  name: string;
  type: "transcript" | "passport" | "test-score" | "recommendation" | "financial" | "other";
  uploaded: boolean;
  required: boolean;
}

export interface Activity {
  name: string;
  role: string;
  years: string;
  description?: string;
}

export interface ReviewerNote {
  id: string;
  author: string;
  date: string;
  content: string;
  tag?: "priority" | "incomplete" | "follow-up" | "general";
}

export interface Decision {
  status: DecisionStatus;
  date?: string;
  rationale?: string;
  followUpRequirements?: string[];
  financialVerificationRequiredForEnrollment?: boolean;
  reviewer?: string;
}

export interface Applicant {
  id: string;
  applicationId: string;
  name: string;
  email: string;
  avatarColor: string;
  country: string;
  countryFlag: string;
  intendedDegree: "Bachelor's" | "Master's" | "PhD" | "Certificate";
  intendedMajor: string;
  gpa: number;
  testScore?: { name: string; value: string };
  applicationStatus: ApplicationStatus;
  applicantType: ApplicantType;
  verification: FinancialVerification;
  scholarship?: ScholarshipInfo;
  decision: Decision;
  submissionDate: string;
  completeness: number; // 0-100
  priority: boolean;
  essays: Essay[];
  documents: Document[];
  activities: Activity[];
  honors: string[];
  notes: ReviewerNote[];
  personal: {
    dateOfBirth: string;
    citizenship: string;
    languages: string[];
    address: string;
  };
  academic: {
    school: string;
    graduationYear: number;
    classRank?: string;
    coursework: string[];
  };
}

export interface MessageThread {
  id: string;
  applicantId: string;
  applicantName: string;
  subject: string;
  category: "info-request" | "verification-reminder" | "conditional-followup" | "general";
  unread: boolean;
  lastMessageAt: string;
  messages: { id: string; from: "university" | "applicant"; author: string; date: string; body: string }[];
}
