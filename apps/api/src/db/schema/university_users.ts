import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { organizations } from "./organizations";
import { users } from "./users";

export const universityUsers = sqliteTable(
  "university_users",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    universityId: text("university_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    title: text("title"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({
    userIdIdx: index("idx_university_users_user_id").on(t.userId),
    universityIdIdx: index("idx_university_users_university_id").on(
      t.universityId,
    ),
  }),
);
