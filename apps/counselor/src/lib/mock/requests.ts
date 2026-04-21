import type { DocumentRequest, Submission, Note, Conversation, Message } from "./types";

const now = Date.now();
const daysFromNow = (n: number) => new Date(now + n * 86400000).toISOString();
const daysAgo = (n: number) => new Date(now - n * 86400000).toISOString();

export const documentRequests: DocumentRequest[] = [
  { id: "r-001", studentId: "s-001", universityId: "u-stanford", documentType: "transcript", documentLabel: "Official Transcript", deadline: daysFromNow(5), status: "pending", createdAt: daysAgo(10) },
  { id: "r-002", studentId: "s-001", universityId: "u-mit", documentType: "recommendation_letter", documentLabel: "Counselor Recommendation", deadline: daysFromNow(3), status: "pending", createdAt: daysAgo(8) },
  { id: "r-003", studentId: "s-003", universityId: "u-columbia", documentType: "transcript", documentLabel: "Official Transcript", deadline: daysFromNow(-2), status: "overdue", createdAt: daysAgo(20) },
  { id: "r-004", studentId: "s-002", universityId: "u-harvard", documentType: "school_profile", documentLabel: "School Profile", deadline: daysFromNow(12), status: "completed", createdAt: daysAgo(15) },
  { id: "r-005", studentId: "s-005", universityId: "u-mit", documentType: "transcript", documentLabel: "Mid-Year Report", deadline: daysFromNow(8), status: "pending", createdAt: daysAgo(4) },
  { id: "r-006", studentId: "s-006", universityId: "u-yale", documentType: "recommendation_letter", documentLabel: "Recommendation Letter", deadline: daysFromNow(14), status: "pending", createdAt: daysAgo(2) },
  { id: "r-007", studentId: "s-009", universityId: "u-harvard", documentType: "transcript", documentLabel: "Official Transcript", deadline: daysFromNow(-5), status: "overdue", createdAt: daysAgo(25) },
  { id: "r-008", studentId: "s-011", universityId: "u-stanford", documentType: "school_profile", documentLabel: "School Profile", deadline: daysFromNow(20), status: "pending", createdAt: daysAgo(1) },
  { id: "r-009", studentId: "s-007", universityId: "u-princeton", documentType: "transcript", documentLabel: "Official Transcript", deadline: daysFromNow(-1), status: "completed", createdAt: daysAgo(30) },
  { id: "r-010", studentId: "s-012", universityId: "u-berkeley", documentType: "recommendation_letter", documentLabel: "Recommendation Letter", deadline: daysFromNow(7), status: "pending", createdAt: daysAgo(3) },
];

export const submissions: Submission[] = [
  { id: "sub-001", studentId: "s-002", documentType: "transcript", documentLabel: "Official Transcript", fileName: "transcript_official.pdf", uploadedAt: daysAgo(2), status: "completed", universityId: "u-harvard" },
  { id: "sub-002", studentId: "s-007", documentType: "recommendation_letter", documentLabel: "Recommendation Letter — English", fileName: "rec_english.pdf", uploadedAt: daysAgo(1), status: "under_review", universityId: "u-mit" },
  { id: "sub-003", studentId: "s-005", documentType: "school_profile", documentLabel: "School Profile", fileName: "lincoln_profile_2025.pdf", uploadedAt: daysAgo(0), status: "uploaded", universityId: "u-stanford" },
  { id: "sub-004", studentId: "s-001", documentType: "transcript", documentLabel: "Official Transcript Draft", fileName: "transcript_draft.pdf", uploadedAt: daysAgo(4), status: "under_review" },
  { id: "sub-005", studentId: "s-006", documentType: "recommendation_letter", documentLabel: "Recommendation Letter — Math", fileName: "rec_math_jamal.pdf", uploadedAt: daysAgo(3), status: "uploaded", universityId: "u-columbia" },
  { id: "sub-006", studentId: "s-009", documentType: "school_profile", documentLabel: "School Profile", fileName: "lincoln_profile_2025.pdf", uploadedAt: daysAgo(6), status: "completed", universityId: "u-yale" },
  { id: "sub-007", studentId: "s-011", documentType: "transcript", documentLabel: "Official Transcript", fileName: "aisha_transcript.pdf", uploadedAt: daysAgo(0), status: "uploaded", universityId: "u-uchicago" },
];

export const notes: Note[] = [
  { id: "n-001", studentId: "s-001", body: "Reminded student to follow up with Mr. Davies for math recommendation.", createdAt: daysAgo(2), author: "Ms. Carter" },
  { id: "n-002", studentId: "s-002", body: "Application package looks excellent. Cleared for submission.", createdAt: daysAgo(5), author: "Ms. Carter" },
  { id: "n-003", studentId: "s-003", body: "Transcript request to registrar — pending overdue. Escalate Monday.", createdAt: daysAgo(1), author: "Ms. Carter" },
];

export const conversations: Conversation[] = [
  { id: "c-001", universityId: "u-stanford", studentId: "s-001", subject: "Transcript request — Amara Johnson", unread: 2, lastMessageAt: daysAgo(0) },
  { id: "c-002", universityId: "u-mit", subject: "Mid-year reports timeline", unread: 0, lastMessageAt: daysAgo(1) },
  { id: "c-003", universityId: "u-harvard", studentId: "s-009", subject: "Missing transcript — Hannah Goldberg", unread: 1, lastMessageAt: daysAgo(2) },
  { id: "c-004", universityId: "u-columbia", studentId: "s-003", subject: "Document clarification — Sofia Ramirez", unread: 0, lastMessageAt: daysAgo(4) },
  { id: "c-005", universityId: "u-yale", subject: "School profile FY25", unread: 0, lastMessageAt: daysAgo(7) },
];

export const messages: Message[] = [
  { id: "m-001", conversationId: "c-001", from: "university", authorName: "Stanford Admissions", body: "Hi — we have not yet received an official transcript for Amara Johnson. Could you upload by Friday?", sentAt: daysAgo(1) },
  { id: "m-002", conversationId: "c-001", from: "counselor", authorName: "Ms. Carter", body: "Apologies for the delay. Submitting today.", sentAt: daysAgo(0) },
  { id: "m-003", conversationId: "c-001", from: "university", authorName: "Stanford Admissions", body: "Thank you — we'll confirm receipt within 48 hours.", sentAt: daysAgo(0) },
  { id: "m-004", conversationId: "c-002", from: "university", authorName: "MIT Admissions", body: "Reminder: mid-year reports due Feb 15.", sentAt: daysAgo(1) },
  { id: "m-005", conversationId: "c-003", from: "university", authorName: "Harvard Admissions", body: "We are missing Hannah Goldberg's transcript. Application is incomplete.", sentAt: daysAgo(2) },
  { id: "m-006", conversationId: "c-004", from: "counselor", authorName: "Ms. Carter", body: "Confirming the school profile is the correct version for Sofia.", sentAt: daysAgo(4) },
  { id: "m-007", conversationId: "c-005", from: "university", authorName: "Yale Admissions", body: "Received your updated school profile. Thank you.", sentAt: daysAgo(7) },
];

export const messageTemplates = [
  { id: "tpl-1", title: "Transcript submitted", body: "Hello, I've submitted the official transcript for the student. Please let me know once received." },
  { id: "tpl-2", title: "Recommendation uploaded", body: "Hello, the recommendation letter has been uploaded on behalf of the student. Confirming receipt would be appreciated." },
  { id: "tpl-3", title: "Document clarification", body: "Hello, could you clarify the format/version of the document you require? Happy to resubmit." },
];
