import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { organizationKinds } from "../enums";

export const organizations = sqliteTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    kind: text("kind", { enum: organizationKinds }).notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    country: text("country"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => ({
    kindSlugIdx: index("idx_organizations_kind_slug").on(t.kind, t.slug),
    kindCheck: check(
      "organizations_kind_check",
      sql`${t.kind} IN ('university','bank')`,
    ),
  }),
);
