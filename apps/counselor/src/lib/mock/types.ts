// Domain types for the School Counselor Portal.
// All entities are kept minimal & serializable so they can be swapped
// for real API responses without component-level changes.

export type DocumentStatus = "missing" | "uploaded" | "under_review" | "completed";
export type RequestStatus = "pending" | "completed" | "overdue";
export type ApplicationStatus = "not_started" | "in_progress" | "submitted" | "complete";
export type DocumentType =
  | "transcript"
  | "recommendation_letter"
  | "school_profile"
  | "mid_year_report"
  | "other";

export interface University {
  id: string;
  name: string;
  shortName: string;
  location: string;
}

export interface DocumentRecord {
  id: string;
  studentId: string;
  type: DocumentType;
  label: string;
  status: DocumentStatus;
  fileName?: string;
  uploadedAt?: string; // ISO
  updatedAt: string; // ISO
  required: boolean;
}

export interface DocumentRequest {
  id: string;
  studentId: string;
  universityId: string;
  documentType: DocumentType;
  documentLabel: string;
  deadline: string; // ISO
  status: RequestStatus;
  createdAt: string;
}

export interface Submission {
  id: string;
  studentId: string;
  documentType: DocumentType;
  documentLabel: string;
  fileName: string;
  uploadedAt: string;
  status: DocumentStatus;
  universityId?: string;
}

export interface Note {
  id: string;
  studentId: string;
  body: string;
  createdAt: string;
  author: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gradeLevel: string;
  gpa: number;
  schoolName: string;
  graduationYear: number;
  academicSummary: string;
  applicationStatus: ApplicationStatus;
  universityIds: string[];
  lastUpdated: string;
}

export interface Message {
  id: string;
  conversationId: string;
  from: "counselor" | "university";
  authorName: string;
  body: string;
  sentAt: string;
}

export interface Conversation {
  id: string;
  universityId: string;
  studentId?: string;
  subject: string;
  unread: number;
  lastMessageAt: string;
}
