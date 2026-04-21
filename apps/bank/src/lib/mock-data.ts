import type { VerificationRequest, Conversation } from "./types";

const countries = ["India", "Nigeria", "Vietnam", "Brazil", "Kenya", "Pakistan", "Indonesia", "Egypt", "Philippines", "Bangladesh"];
const studies = ["Computer Science", "Business Administration", "Mechanical Engineering", "Public Health", "Economics", "Data Science"];
const universities = ["University of Toronto", "ETH Zurich", "TU Munich", "University of Melbourne", "King's College London", "TU Delft"];
const branches = ["Mumbai Central", "Lagos VI", "Hanoi Main", "São Paulo Centro", "Nairobi CBD", "Karachi Clifton", "Jakarta Pusat", "Cairo Heliopolis", "Manila Makati", "Dhaka Gulshan"];
const firstNames = ["Aarav", "Chinwe", "Linh", "Mateus", "Wanjiru", "Zara", "Putri", "Nour", "Andrea", "Tahmid", "Ishaan", "Ade", "Minh", "Sofia", "Kamau"];
const lastNames = ["Sharma", "Okafor", "Nguyen", "Silva", "Mwangi", "Khan", "Wijaya", "Hassan", "Reyes", "Rahman", "Patel", "Adeyemi", "Tran", "Costa", "Otieno"];
const guardianNames = ["Rajesh Sharma", "Ngozi Okafor", "Hieu Nguyen", "Carlos Silva", "Grace Mwangi", "Imran Khan", "Budi Wijaya", "Fatima Hassan", "Maria Reyes", "Anwar Rahman"];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function pad(n: number, w: number) {
  return n.toString().padStart(w, "0");
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const statuses: VerificationRequest["status"][] = [
  "pending", "pending", "pending", "pending",
  "under_review", "under_review", "under_review",
  "approved", "approved", "approved", "approved", "approved", "approved",
  "rejected", "rejected", "rejected",
  "pending", "under_review", "approved", "rejected",
];

function makeRequest(i: number): VerificationRequest {
  const status = statuses[i % statuses.length];
  const fn = pick(firstNames, i);
  const ln = pick(lastNames, i + 3);
  const studentName = `${fn} ${ln}`;
  const guardian = pick(guardianNames, i + 1);
  const country = pick(countries, i);
  const requested = 15000 + ((i * 7919) % 85000);
  const submitted = daysAgo((i * 3) % 45);
  const decision = status === "approved" || status === "rejected" ? daysAgo(((i * 3) % 45) - 1 < 0 ? 0 : ((i * 3) % 45) - 1) : undefined;
  const accountSuffix = pad(1000 + (i * 137) % 9000, 4);
  const checklistDone = status === "approved";
  const checklistPartial = status === "under_review";

  const notes: VerificationRequest["notes"] = [
    {
      id: `n-${i}-1`,
      actor: "System",
      action: "Request received",
      timestamp: submitted,
    },
  ];
  if (status !== "pending") {
    notes.push({
      id: `n-${i}-2`,
      actor: "Officer Mensah",
      action: "Marked under review",
      note: "Initial document scan completed.",
      timestamp: daysAgo(((i * 3) % 45) - 1 < 0 ? 0 : ((i * 3) % 45) - 1),
    });
  }
  if (status === "approved") {
    notes.push({
      id: `n-${i}-3`,
      actor: "Officer Mensah",
      action: "Approved",
      note: "All checks passed. Funds confirmed.",
      timestamp: decision ?? submitted,
    });
  }
  if (status === "rejected") {
    notes.push({
      id: `n-${i}-3`,
      actor: "Officer Mensah",
      action: "Rejected",
      note: "Insufficient funds in stated account.",
      timestamp: decision ?? submitted,
    });
  }

  return {
    id: `req-${pad(i + 1, 4)}`,
    code: `VRF-${pad(202400 + i, 6)}`,
    student: {
      id: `stu-${i}`,
      fullName: studentName,
      country,
      intendedStudy: pick(studies, i),
      university: pick(universities, i + 2),
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@mail.com`,
    },
    guardian: {
      id: `g-${i}`,
      fullName: guardian,
      relationship: i % 3 === 0 ? "Father" : i % 3 === 1 ? "Mother" : "Uncle",
      email: `guardian${i}@mail.com`,
      phone: `+1 555 010 ${pad(i, 4)}`,
    },
    account: {
      id: `acc-${i}`,
      accountNumber: `00000000${accountSuffix}`,
      branch: pick(branches, i),
      currency: "USD",
      holderName: guardian,
    },
    requestedAmount: requested,
    scholarshipAdjustedAmount: i % 4 === 0 ? requested - 5000 : undefined,
    currency: "USD",
    status,
    submittedAt: submitted,
    decisionAt: decision,
    verifiedAmount: status === "approved" ? requested : undefined,
    rejectionReason: status === "rejected" ? "Insufficient funds" : undefined,
    documents: [
      { id: `doc-${i}-1`, name: "Bank Statement (3 months)", type: "PDF", status: i % 5 === 0 ? "missing" : checklistDone ? "reviewed" : "uploaded", uploadedAt: submitted },
      { id: `doc-${i}-2`, name: "Account Ownership Letter", type: "PDF", status: checklistDone ? "reviewed" : "uploaded", uploadedAt: submitted },
      { id: `doc-${i}-3`, name: "Guardian ID Proof", type: "Image", status: i % 6 === 0 ? "missing" : "uploaded", uploadedAt: submitted },
    ],
    checklist: {
      accountExists: checklistDone || checklistPartial,
      belongsToGuardian: checklistDone || checklistPartial,
      fundsSufficient: checklistDone,
      documentsVerified: checklistDone,
    },
    notes,
    assignedTo: status !== "pending" ? "Officer Mensah" : undefined,
  };
}

export const mockRequests: VerificationRequest[] = Array.from({ length: 22 }, (_, i) => makeRequest(i));

export const mockConversations: Conversation[] = mockRequests.slice(0, 6).map((r, i) => ({
  id: `conv-${i}`,
  requestCode: r.code,
  studentName: r.student.fullName,
  subject: i % 2 === 0 ? "Additional documents needed" : "Account clarification",
  unread: i % 3 === 0 ? 2 : 0,
  lastMessageAt: daysAgo(i),
  messages: [
    {
      id: `m-${i}-1`,
      from: "system",
      authorName: "System",
      body: `Verification request ${r.code} created.`,
      timestamp: r.submittedAt,
    },
    {
      id: `m-${i}-2`,
      from: "bank",
      authorName: "Officer Mensah",
      body: i % 2 === 0
        ? "Could you please upload the latest 3-month bank statement signed by the branch?"
        : "We need clarification on the account holder's relationship to the student.",
      timestamp: daysAgo(i + 1),
    },
    {
      id: `m-${i}-3`,
      from: "student",
      authorName: r.student.fullName,
      body: "Sure, I'll get this to you within 24 hours.",
      timestamp: daysAgo(i),
    },
  ],
}));

export const messageTemplates = [
  { id: "tpl-docs", label: "Request additional documents", body: "Hello, please upload the latest 3-month bank statement and the guardian's signed account ownership letter so we can complete your verification." },
  { id: "tpl-account", label: "Clarify account details", body: "Could you confirm the relationship between the account holder and the student, and provide the branch name?" },
  { id: "tpl-done", label: "Verification completed", body: "Your verification is complete. The university will be notified of the result within 1 business day." },
];

export const rejectionReasons = [
  "Insufficient funds",
  "Account does not belong to guardian",
  "Documents missing or unreadable",
  "Suspected fraudulent documents",
  "Account closed or inactive",
  "Other",
];