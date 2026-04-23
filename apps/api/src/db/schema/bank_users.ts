import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { organizations } from "./organizations";
import { users } from "./users";

// `bank_id` is nullable because a bank user may be invited before their
// organization record is attached (checklist Phase 3.5 discussed but deferred).
export const bankUsers = sqliteTable(
  "bank_users",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bankId: text("bank_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({
    userIdIdx: index("idx_bank_users_user_id").on(t.userId),
    bankIdIdx: index("idx_bank_users_bank_id").on(t.bankId),
  }),
);
