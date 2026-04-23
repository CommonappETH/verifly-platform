import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { students } from "./students";

export const guardians = sqliteTable(
  "guardians",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    relationship: text("relationship"),
    email: text("email"),
    phone: text("phone"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({
    studentIdIdx: index("idx_guardians_student_id").on(t.studentId),
  }),
);
