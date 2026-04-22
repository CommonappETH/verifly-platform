// Student portal view models. Enum unions come from @verifly/types.

import type {
  ApplicationStatus,
  DocumentStatus,
  VerificationStatus,
} from "@verifly/types";

export type { ApplicationStatus, DocumentStatus, VerificationStatus };

export type ScholarshipStatus = "not_applied" | "applied" | "awarded";

export type VerificationPreference = "required" | "preferred" | "optional";

export type NotificationCategory =
  | "application_update"
  | "verification_request"
  | "missing_document"
  | "scholarship_update"
  | "general";

export interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  logo: string;
  banner: string;
  description: string;
  programs: string[];
  tuitionMin: number;
  tuitionMax: number;
  currency: string;
  applicationDeadline: string;
  verificationPreference: VerificationPreference;
  scholarshipAvailable: boolean;
  scholarshipNote: string;
  admissionsNotes: string;
  ranking: string;
  acceptanceRate: string;
  website: string;
}

export interface Application {
  id: string;
  universityId: string;
  universityName: string;
  program: string;
  status: ApplicationStatus;
  verificationStatus: VerificationStatus;
  scholarshipStatus: ScholarshipStatus;
  submittedDate: string | null;
  lastUpdated: string;
  estimatedScholarship: number;
  tuitionAmount: number;
  notes: string[];
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  completed: boolean;
  current?: boolean;
}

export interface StudentDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  status: DocumentStatus;
  uploadedDate: string | null;
  fileSize: string | null;
  notes: string;
}

export type DocumentCategory =
  | "passport_id"
  | "academic_records"
  | "bank_statements"
  | "sponsor_letters"
  | "scholarship_letters"
  | "other";

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  amount: number;
  currency: string;
  eligibility: string;
  deadline: string;
  status: ScholarshipStatus;
  description: string;
  coverageType: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  date: string;
  read: boolean;
  source: string;
  actionUrl?: string;
}

// Renamed from `StudentProfile` → `Student` per learningguide §7.
// Kept as a student-portal rich view of the canonical Student.
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  countryOfOrigin: string;
  nationality: string;
  passportNumber: string;
  currentAddress: string;
  intendedDegreeLevel: string;
  fieldOfStudy: string;
  previousInstitution: string;
  gpa: string;
  englishProficiency: string;
  testScore: string;
  sponsorName: string;
  sponsorRelationship: string;
  sponsorOccupation: string;
  estimatedBudget: number;
  currency: string;
  savedUniversities: string[];
  profileCompleteness: number;
  // Extended optional profile fields
  middleName?: string;
  preferredName?: string;
  gender?: string;
  countryOfResidence?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  graduationYear?: string;
  gradingScale?: string;
  academicInterests?: string;
  curriculum?: string;
  stream?: string;
  schoolCountry?: string;
  sponsorEmployer?: string;
  householdSize?: string;
  dependents?: string;
  annualIncomeRange?: string;
  fundingSource?: string;
  liquidFunds?: number;
  sponsorContribution?: number;
  scholarshipExpectation?: number;
  preApprovalStatus?: "approved" | "pending" | "not_started";
  preferredCountries?: string[];
  preferredIntake?: string;
  preferredDegreeLevel?: string;
  areasOfInterest?: string[];
  notificationPreferences?: string;
  lastUpdated?: string;
  activities?: { id: string; name: string; role: string; years: string }[];
  honors?: { id: string; name: string; year: string }[];
}

export interface BankPartner {
  id: string;
  name: string;
  country: string;
  logo: string;
  description: string;
  processingTime: string;
  requiredDocuments: string[];
}

export interface FinancialSummary {
  totalTuitionNeeded: number;
  estimatedScholarships: number;
  remainingAmount: number;
  verifiedAmount: number;
  currency: string;
  verificationStatus: VerificationStatus;
}
