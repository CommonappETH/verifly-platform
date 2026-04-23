import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { users } from "./users";

// `id` is the SHA-256 of the raw session token. We never store the token
// itself, so a DB leak can't be used to mint live cookies.
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    revokedAt: integer("revoked_at"),
  },
  (t) => ({
    userIdIdx: index("idx_sessions_user_id").on(t.userId),
    expiresAtIdx: index("idx_sessions_expires_at").on(t.expiresAt),
  }),
);
