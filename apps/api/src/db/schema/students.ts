import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { users } from "./users";

export const students = sqliteTable(
  "students",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    firstName: text("first_name"),
    lastName: text("last_name"),
    fullName: text("full_name"),
    country: text("country"),
    nationality: text("nationality"),
    gpa: real("gpa"),
    university: text("university"),
    intendedStudy: text("intended_study"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
  },
  (t) => ({
    userIdIdx: index("idx_students_user_id").on(t.userId),
  }),
);
