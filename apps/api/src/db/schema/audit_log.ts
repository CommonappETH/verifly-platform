import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// `metadata` is a stringified JSON blob, Zod-parsed at read time.
// See namingconventions.md §4.9: no relational JSON columns in v1.
// `actor_user_id` is free-text (not an FK) so audit rows outlive deleted users.
export const auditLog = sqliteTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    metadata: text("metadata"),
    createdAt: integer("created_at").notNull(),
    ip: text("ip"),
  },
  (t) => ({
    entityIdx: index("idx_audit_log_entity_type_entity_id").on(
      t.entityType,
      t.entityId,
    ),
  }),
);
