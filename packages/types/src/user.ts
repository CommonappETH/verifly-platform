import type { UserRole } from "./status";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

// Canonical student shape. Apps with richer per-portal view models should
// intersect / extend this (e.g. `interface ApplicantView extends Student { ... }`)
// rather than redeclaring a parallel type named `StudentProfile` or `Applicant`.
export interface Student {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  country?: string;
  nationality?: string;
  gpa?: number | string;
  university?: string;
  intendedStudy?: string;
}

export interface Guardian {
  id: string;
  fullName: string;
  relationship?: string;
  email?: string;
  phone?: string;
}

export interface Counselor {
  id: string;
  email: string;
  name: string;
  schoolName?: string;
}

export interface BankUser {
  id: string;
  email: string;
  name: string;
  bankId?: string;
}
