import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { documentKinds, documentStatuses } from "../enums";
import { applications } from "./applications";
import { users } from "./users";
import { verifications } from "./verifications";

// `storage_key` is the relative path inside `STORAGE_DIR` (filesystem today,
// S3 key in Phase 15). It must be unique so two uploads never collide.
export const documents = sqliteTable(
  "documents",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: documentKinds }).notNull(),
    status: text("status", { enum: documentStatuses }).notNull(),
    applicationId: text("application_id").references(() => applications.id, {
      onDelete: "set null",
    }),
    verificationId: text("verification_id").references(() => verifications.id, {
      onDelete: "set null",
    }),
    storageKey: text("storage_key").notNull().unique(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedAt: integer("uploaded_at").notNull(),
    reviewedAt: integer("reviewed_at"),
  },
  (t) => ({
    ownerIdIdx: index("idx_documents_owner_id").on(t.ownerId),
    applicationIdIdx: index("idx_documents_application_id").on(t.applicationId),
    verificationIdIdx: index("idx_documents_verification_id").on(
      t.verificationId,
    ),
    kindCheck: check(
      "documents_kind_check",
      sql`${t.kind} IN ('transcript','passport','test_score','recommendation_letter','school_profile','mid_year_report','bank_statement','sponsor_letter','scholarship_letter','academic_record','other')`,
    ),
    statusCheck: check(
      "documents_status_check",
      sql`${t.status} IN ('missing','uploaded','under_review','approved','needs_replacement')`,
    ),
  }),
);
