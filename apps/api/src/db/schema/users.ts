import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { userRoles } from "../enums";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role", { enum: userRoles }).notNull(),
    name: text("name"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
  },
  (t) => ({
    emailIdx: index("idx_users_email").on(t.email),
    roleCheck: check(
      "users_role_check",
      sql`${t.role} IN ('admin','student','counselor','bank','university')`,
    ),
  }),
);
