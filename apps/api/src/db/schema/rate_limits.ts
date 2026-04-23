import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// KV-less local rate limiter. `key` is domain-specific — e.g.
// `ip:127.0.0.1:/auth/login`. `window_start` is Unix millis.
export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: integer("window_start").notNull(),
  count: integer("count").notNull(),
});
