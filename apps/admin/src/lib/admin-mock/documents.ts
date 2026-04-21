import type { AdminDocument } from "./types";

const types = ["Transcript", "Letter of Recommendation", "Passport", "Financial Statement", "Personal Statement", "School Profile", "Test Scores"];

function mk(i: number, studentId: string, type: string, uploadedBy: "student" | "counselor", universityId: string | null, status: AdminDocument["status"], days: number): AdminDocument {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return { id: `d${i}`, studentId, type, uploadedBy, universityId, status, updatedAt: d.toISOString() };
}

export const adminDocuments: AdminDocument[] = [
  mk(1, "u1", types[0], "counselor", "org-uni-1", "completed", 12),
  mk(2, "u1", types[1], "counselor", "org-uni-1", "completed", 14),
  mk(3, "u1", types[3], "student", "org-uni-1", "completed", 9),
  mk(4, "u2", types[0], "counselor", "org-uni-2", "under_review", 3),
  mk(5, "u2", types[2], "student", "org-uni-2", "completed", 5),
  mk(6, "u2", types[4], "student", "org-uni-2", "missing", 0),
  mk(7, "u3", types[0], "counselor", "org-uni-1", "missing", 0),
  mk(8, "u3", types[1], "counselor", "org-uni-1", "missing", 0),
  mk(9, "u3", types[3], "student", "org-uni-1", "overdue", 35),
  mk(10, "u4", types[0], "counselor", "org-uni-3", "completed", 60),
  mk(11, "u4", types[5], "counselor", "org-uni-3", "completed", 58),
  mk(12, "u5", types[0], "counselor", "org-uni-6", "completed", 90),
  mk(13, "u5", types[1], "counselor", "org-uni-6", "completed", 88),
  mk(14, "u5", types[6], "student", "org-uni-6", "completed", 80),
  mk(15, "u6", types[0], "counselor", "org-uni-4", "completed", 25),
  mk(16, "u6", types[3], "student", "org-uni-4", "under_review", 4),
  mk(17, "u6", types[4], "student", "org-uni-4", "completed", 22),
  mk(18, "u7", types[0], "counselor", "org-uni-5", "completed", 30),
  mk(19, "u7", types[1], "counselor", "org-uni-5", "completed", 29),
  mk(20, "u7", types[3], "student", "org-uni-5", "overdue", 45),
  mk(21, "u8", types[0], "counselor", "org-uni-2", "completed", 40),
  mk(22, "u8", types[6], "student", "org-uni-2", "completed", 38),
  mk(23, "u9", types[0], "counselor", "org-uni-3", "missing", 0),
  mk(24, "u9", types[3], "student", "org-uni-3", "missing", 0),
  mk(25, "u9", types[4], "student", "org-uni-3", "overdue", 32),
  mk(26, "u10", types[0], "counselor", "org-uni-4", "completed", 8),
  mk(27, "u10", types[3], "student", "org-uni-4", "under_review", 2),
  mk(28, "u11", types[0], "counselor", "org-uni-1", "completed", 18),
  mk(29, "u11", types[1], "counselor", "org-uni-1", "completed", 17),
  mk(30, "u11", types[3], "student", "org-uni-1", "completed", 10),
  mk(31, "u12", types[0], "counselor", "org-uni-5", "completed", 70),
  mk(32, "u12", types[6], "student", "org-uni-5", "completed", 68),
  mk(33, "u3", types[6], "student", "org-uni-1", "missing", 0),
  mk(34, "u9", types[1], "counselor", "org-uni-3", "under_review", 6),
  mk(35, "u17", null as never, "student", "org-uni-4", "missing", 0),
  mk(36, "u6", types[1], "counselor", "org-uni-1", "missing", 0),
  mk(37, "u10", types[1], "counselor", "org-uni-4", "under_review", 7),
  mk(38, "u2", types[1], "counselor", "org-uni-2", "completed", 11),
  mk(39, "u8", types[1], "counselor", "org-uni-2", "completed", 36),
  mk(40, "u4", types[3], "student", "org-uni-3", "overdue", 50),
].filter(d => d.type); // strip the bad row
