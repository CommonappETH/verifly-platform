import type { ActivityEvent } from "./types";

export const activity: ActivityEvent[] = [
  { id: "ev1", kind: "verification_approved", message: "Verification VER-2025-0019 approved for Yuki Tanaka", actor: "Rachel Tan · HSBC", at: "2025-04-20T08:42:00Z" },
  { id: "ev2", kind: "application_submitted", message: "New application: Aarav Mehta → Stanford (MS CS)", actor: "Aarav Mehta", at: "2025-04-20T08:14:00Z" },
  { id: "ev3", kind: "document_uploaded", message: "Transcript uploaded for Lina Park", actor: "Ms. Patel · Counselor", at: "2025-04-20T07:55:00Z" },
  { id: "ev4", kind: "issue_flagged", message: "Verification VER-2025-0013 flagged for review (high value)", actor: "Jordan Reyes · Admin", at: "2025-04-20T07:30:00Z" },
  { id: "ev5", kind: "verification_rejected", message: "Verification VER-2025-0015 rejected for Noah Williams", actor: "David Cohen · Citibank", at: "2025-04-19T16:10:00Z" },
  { id: "ev6", kind: "user_suspended", message: "User Sofia Rossi suspended", actor: "Sam Okafor · Admin", at: "2025-04-19T14:00:00Z" },
  { id: "ev7", kind: "document_uploaded", message: "Financial Statement uploaded for Omar Haddad", actor: "Omar Haddad", at: "2025-04-19T11:22:00Z" },
  { id: "ev8", kind: "application_submitted", message: "New application: Hannah Schmidt → ETH Zurich", actor: "Hannah Schmidt", at: "2025-04-19T09:01:00Z" },
  { id: "ev9", kind: "verification_approved", message: "Verification VER-2025-0017 approved for Emma Dubois", actor: "Olivia Martin · Standard Chartered", at: "2025-04-18T15:40:00Z" },
  { id: "ev10", kind: "document_uploaded", message: "Letter of Recommendation uploaded for Aarav Mehta", actor: "Mrs. Iyer · Counselor", at: "2025-04-18T12:00:00Z" },
  { id: "ev11", kind: "user_activated", message: "User Anna Müller reactivated", actor: "Ines Vidal · Admin", at: "2025-04-18T10:00:00Z" },
  { id: "ev12", kind: "issue_flagged", message: "Verification VER-2025-0020 flagged: amount mismatch", actor: "Jordan Reyes · Admin", at: "2025-04-17T18:30:00Z" },
  { id: "ev13", kind: "application_submitted", message: "New application: Priya Sharma → Imperial College", actor: "Priya Sharma", at: "2025-04-17T14:15:00Z" },
  { id: "ev14", kind: "verification_approved", message: "Verification VER-2025-0014 approved (verified < requested)", actor: "David Cohen · Citibank", at: "2025-04-08T16:00:00Z" },
  { id: "ev15", kind: "document_uploaded", message: "Personal Statement uploaded for Lina Park", actor: "Lina Park", at: "2025-04-17T10:00:00Z" },
];
