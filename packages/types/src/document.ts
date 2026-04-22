import type { DocumentStatus } from "./status";

export type DocumentKind =
  | "transcript"
  | "passport"
  | "test_score"
  | "recommendation"
  | "recommendation_letter"
  | "school_profile"
  | "mid_year_report"
  | "financial"
  | "bank_statement"
  | "sponsor_letter"
  | "scholarship_letter"
  | "academic_record"
  | "other";

export interface Document {
  id: string;
  name?: string;
  kind?: DocumentKind;
  status: DocumentStatus;
  uploadedAt?: string;
  updatedAt?: string;
  required?: boolean;
}
