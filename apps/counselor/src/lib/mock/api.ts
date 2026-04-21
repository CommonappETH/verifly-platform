// Thin async wrappers around mock data. Swap these for real fetch calls
// when wiring to the backend — components stay unchanged.

import { students, documents } from "./students";
import { universities } from "./universities";
import { documentRequests, submissions, notes, conversations, messages } from "./requests";
import type { DocumentRecord, DocumentStatus, Note, Student } from "./types";

const wait = <T>(value: T, ms = 0) => new Promise<T>((r) => setTimeout(() => r(value), ms));

export async function getStudents() {
  return wait(students);
}
export async function getStudentById(id: string) {
  return wait(students.find((s) => s.id === id));
}
export async function getUniversities() {
  return wait(universities);
}
export function getUniversityById(id: string) {
  return universities.find((u) => u.id === id);
}
export async function getDocumentsForStudent(studentId: string) {
  return wait(documents.filter((d) => d.studentId === studentId));
}
export async function getDocumentRequests() {
  return wait(documentRequests);
}
export async function getDocumentRequestsForStudent(studentId: string) {
  return wait(documentRequests.filter((r) => r.studentId === studentId));
}
export async function getSubmissions() {
  return wait(submissions);
}
export async function getNotesForStudent(studentId: string) {
  return wait(notes.filter((n) => n.studentId === studentId));
}
export async function getConversations() {
  return wait(conversations);
}
export async function getMessages(conversationId: string) {
  return wait(messages.filter((m) => m.conversationId === conversationId));
}

// Studentwide rollups
export function getStudentDocStatus(studentId: string): "complete" | "incomplete" {
  const docs = documents.filter((d) => d.studentId === studentId && d.required);
  if (docs.length === 0) return "incomplete";
  return docs.every((d) => d.status === "completed" || d.status === "uploaded" || d.status === "under_review")
    ? "complete"
    : "incomplete";
}

export function getStudentLabel(s: Student) {
  return `${s.firstName} ${s.lastName}`;
}

// Mock mutations (in-memory only, persist for the session)
export function uploadDocumentMock(doc: DocumentRecord, fileName: string): DocumentRecord {
  doc.fileName = fileName;
  doc.status = "uploaded";
  doc.uploadedAt = new Date().toISOString();
  doc.updatedAt = new Date().toISOString();
  return doc;
}

export function setDocumentStatusMock(doc: DocumentRecord, status: DocumentStatus): DocumentRecord {
  doc.status = status;
  doc.updatedAt = new Date().toISOString();
  return doc;
}

export function addNoteMock(studentId: string, body: string, author = "Ms. Carter"): Note {
  const note: Note = {
    id: `n-${Date.now()}`,
    studentId,
    body,
    createdAt: new Date().toISOString(),
    author,
  };
  notes.push(note);
  return note;
}

export function deleteNoteMock(id: string) {
  const idx = notes.findIndex((n) => n.id === id);
  if (idx >= 0) notes.splice(idx, 1);
}
