import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import {
  applicantTypes,
  applicationStatuses,
  decisionStatuses,
  documentStatuses,
  verificationStatuses,
} from "../enums";
import { organizations } from "./organizations";
import { students } from "./students";

export const applications = sqliteTable(
  "applications",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    universityId: text("university_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    program: text("program"),
    status: text("status", { enum: applicationStatuses }).notNull(),
    verificationStatus: text("verification_status", {
      enum: verificationStatuses,
    }),
    documentStatus: text("document_status", { enum: documentStatuses }),
    decisionStatus: text("decision_status", { enum: decisionStatuses }),
    applicantType: text("applicant_type", { enum: applicantTypes }),
    submittedAt: integer("submitted_at"),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({
    studentIdIdx: index("idx_applications_student_id").on(t.studentId),
    universityIdStatusIdx: index("idx_applications_university_id_status").on(
      t.universityId,
      t.status,
    ),
    statusCheck: check(
      "applications_status_check",
      sql`${t.status} IN ('draft','submitted','under_review','awaiting_info','awaiting_verification','committee_review','conditionally_admitted','admitted','rejected','waitlisted')`,
    ),
    verificationStatusCheck: check(
      "applications_verification_status_check",
      sql`${t.verificationStatus} IS NULL OR ${t.verificationStatus} IN ('pending','under_review','more_info_needed','verified','rejected')`,
    ),
    documentStatusCheck: check(
      "applications_document_status_check",
      sql`${t.documentStatus} IS NULL OR ${t.documentStatus} IN ('missing','uploaded','under_review','approved','needs_replacement')`,
    ),
    decisionStatusCheck: check(
      "applications_decision_status_check",
      sql`${t.decisionStatus} IS NULL OR ${t.decisionStatus} IN ('none','pending','admit','conditional_admit','waitlist','reject')`,
    ),
    applicantTypeCheck: check(
      "applications_applicant_type_check",
      sql`${t.applicantType} IS NULL OR ${t.applicantType} IN ('pre_approved','normal')`,
    ),
  }),
);
