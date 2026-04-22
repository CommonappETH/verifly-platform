// University portal view models. Enum unions come from @verifly/types;
// this module keeps only the university-specific rich shapes.

import type {
  ApplicantType,
  ApplicationStatus,
  DecisionStatus,
  VerificationStatus,
} from "@verifly/types";

export type { ApplicantType, ApplicationStatus, DecisionStatus, VerificationStatus };

export type VerificationTiming =
  | "pre_application"
  | "post_application"
  | "post_admission";

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
  type: "transcript" | "passport" | "test_score" | "recommendation" | "financial" | "other";
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
  tag?: "priority" | "incomplete" | "follow_up" | "general";
}

export interface Decision {
  status: DecisionStatus;
  date?: string;
  rationale?: string;
  followUpRequirements?: string[];
  financialVerificationRequiredForEnrollment?: boolean;
  reviewer?: string;
}

// Renamed from `Applicant` → `Student` per learningguide §7.
// Kept as a university-specific rich view of the canonical Student.
export interface Student {
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
  category: "info_request" | "verification_reminder" | "conditional_followup" | "general";
  unread: boolean;
  lastMessageAt: string;
  messages: { id: string; from: "university" | "applicant"; author: string; date: string; body: string }[];
}
