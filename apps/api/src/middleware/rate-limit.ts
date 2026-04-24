import type { MiddlewareHandler } from "hono";
import { sql } from "drizzle-orm";

import { RateLimitError } from "../lib/errors";
import { rateLimits } from "../db/schema";
import type { Ctx } from "../platform/ports";

export interface RateLimitConfig {
  // Human-readable key for the rule (e.g. "auth.login"). Combined with the
  // subject (ip or user id) to form the DB row key.
  name: string;
  windowMs: number;
  max: number;
  by?: "ip" | "user";
}

function clientIp(c: {
  req: { header: (name: string) => string | undefined; raw?: Request };
}): string {
  const fwd = c.req.header("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return c.req.header("x-real-ip") ?? "0.0.0.0";
}

export function rateLimit(cfg: RateLimitConfig): MiddlewareHandler {
  return async (c, next) => {
    const ctx = c.get("ctx") as Ctx;
    const subject =
      cfg.by === "user"
        ? ((c.get("user") as { id?: string } | undefined)?.id ?? clientIp(c))
        : clientIp(c);
    const key = `${cfg.by ?? "ip"}:${subject}:${cfg.name}`;
    const now = ctx.clock.now();
    const windowStart = now - (now % cfg.windowMs);

    const db = ctx.db.handle();
    const result = db
      .insert(rateLimits)
      .values({ key, windowStart, count: 1 })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`CASE WHEN ${rateLimits.windowStart} = ${windowStart} THEN ${rateLimits.count} + 1 ELSE 1 END`,
          windowStart: sql`${windowStart}`,
        },
      })
      .returning({ count: rateLimits.count, windowStart: rateLimits.windowStart })
      .all();

    const row = result[0];
    const count = row?.count ?? 1;
    if (count > cfg.max) {
      const retryAfter = Math.ceil((windowStart + cfg.windowMs - now) / 1000);
      c.header("Retry-After", String(Math.max(1, retryAfter)));
      throw new RateLimitError("rate limit exceeded", { rule: cfg.name, retry_after: retryAfter });
    }
    await next();
  };
}
