import { mockRequests, mockConversations } from "./mock-data";
import type { VerificationRequest, ChecklistState, HistoryEntry, Conversation, ConversationMessage, VerificationDocument } from "./types";

// In-memory mutable store. Backend swap point: replace these functions with real API calls.
let requests: VerificationRequest[] = [...mockRequests];
let conversations: Conversation[] = [...mockConversations];

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getRequests(): VerificationRequest[] {
  return requests;
}

export function getRequestById(id: string): VerificationRequest | undefined {
  return requests.find((r) => r.id === id || r.code.toLowerCase() === id.toLowerCase());
}

export function findRequestByCode(code: string): VerificationRequest | undefined {
  const q = code.trim().toLowerCase();
  return requests.find((r) => r.code.toLowerCase() === q);
}

function update(id: string, patch: (r: VerificationRequest) => VerificationRequest) {
  requests = requests.map((r) => (r.id === id ? patch(r) : r));
  emit();
}

function addHistory(r: VerificationRequest, entry: Omit<HistoryEntry, "id" | "timestamp">): HistoryEntry[] {
  return [
    ...r.notes,
    { ...entry, id: `n-${r.id}-${r.notes.length + 1}`, timestamp: new Date().toISOString() },
  ];
}

export function setChecklist(id: string, checklist: ChecklistState) {
  update(id, (r) => ({ ...r, checklist }));
}

export function approveRequest(id: string, verifiedAmount: number, note: string) {
  update(id, (r) => ({
    ...r,
    status: "approved",
    verifiedAmount,
    decisionAt: new Date().toISOString(),
    notes: addHistory(r, { actor: "You", action: "Approved", note: note || `Verified amount: ${verifiedAmount} ${r.currency}` }),
  }));
}

export function rejectRequest(id: string, reason: string, note: string) {
  update(id, (r) => ({
    ...r,
    status: "rejected",
    rejectionReason: reason,
    decisionAt: new Date().toISOString(),
    notes: addHistory(r, { actor: "You", action: "Rejected", note: `${reason}${note ? ` — ${note}` : ""}` }),
  }));
}

export function markUnderReview(id: string) {
  update(id, (r) => ({
    ...r,
    status: "under_review",
    notes: addHistory(r, { actor: "You", action: "Marked under review" }),
  }));
}

export function requestMoreInfo(id: string, message: string) {
  update(id, (r) => ({
    ...r,
    notes: addHistory(r, { actor: "You", action: "Requested more info", note: message }),
  }));
}

export function addInternalNote(id: string, note: string) {
  update(id, (r) => ({
    ...r,
    notes: addHistory(r, { actor: "You", action: "Internal note", note }),
  }));
}

export function uploadDocument(id: string, name: string, type: string) {
  update(id, (r) => {
    const existingIdx = r.documents.findIndex((d) => d.type === type);
    const doc: VerificationDocument = {
      id: existingIdx >= 0 ? r.documents[existingIdx].id : `d-${r.id}-${r.documents.length + 1}`,
      name,
      type,
      status: "uploaded",
      uploadedAt: new Date().toISOString(),
    };
    const documents = existingIdx >= 0
      ? r.documents.map((d, i) => (i === existingIdx ? doc : d))
      : [...r.documents, doc];
    return {
      ...r,
      documents,
      notes: addHistory(r, { actor: "You", action: "Uploaded document", note: `${name} (${type})` }),
    };
  });
}

export function getConversations(): Conversation[] {
  return conversations;
}

export function sendMessage(conversationId: string, body: string) {
  conversations = conversations.map((c) => {
    if (c.id !== conversationId) return c;
    const msg: ConversationMessage = {
      id: `m-${c.id}-${c.messages.length + 1}`,
      from: "bank",
      authorName: "You",
      body,
      timestamp: new Date().toISOString(),
    };
    return { ...c, messages: [...c.messages, msg], lastMessageAt: msg.timestamp, unread: 0 };
  });
  emit();
}

export function maskAccount(num: string): string {
  const tail = num.slice(-4);
  return `••••${tail}`;
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}