import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { verificationStatuses } from "../enums";
import { applications } from "./applications";
import { guardians } from "./guardians";
import { organizations } from "./organizations";
import { students } from "./students";

// `requested_amount` / `verified_amount` are stored in minor currency units
// (e.g. cents) to keep them integer and lossless across SQLite and Postgres.
export const verifications = sqliteTable(
  "verifications",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    applicationId: text("application_id").references(() => applications.id, {
      onDelete: "set null",
    }),
    bankId: text("bank_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    guardianId: text("guardian_id").references(() => guardians.id, {
      onDelete: "set null",
    }),
    requestedAmount: integer("requested_amount").notNull(),
    verifiedAmount: integer("verified_amount"),
    currency: text("currency").notNull(),
    status: text("status", { enum: verificationStatuses }).notNull(),
    rejectionReason: text("rejection_reason"),
    submittedAt: integer("submitted_at"),
    decidedAt: integer("decided_at"),
    verifiedAt: integer("verified_at"),
  },
  (t) => ({
    studentIdIdx: index("idx_verifications_student_id").on(t.studentId),
    bankIdStatusIdx: index("idx_verifications_bank_id_status").on(
      t.bankId,
      t.status,
    ),
    codeIdx: index("idx_verifications_code").on(t.code),
    statusCheck: check(
      "verifications_status_check",
      sql`${t.status} IN ('pending_submission','pending','under_review','more_info_needed','verified','rejected')`,
    ),
  }),
);
