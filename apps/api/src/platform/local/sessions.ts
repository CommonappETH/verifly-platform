import { and, eq, gt, isNull, like } from "drizzle-orm";
import { sessions } from "../../db/schema";
import type { Clock, DbPort, SessionRecord, SessionStorePort } from "../ports";

// Local session store persists to the `sessions` table. Keys are opaque
// identifiers (the auth layer uses SHA-256(token)); the adapter enforces TTL
// on read so callers don't need to check expires_at themselves.
export function createLocalSessionStore(db: DbPort, clock: Clock): SessionStorePort {
  return {
    async get(key) {
      const now = clock.now();
      const rows = await db
        .handle()
        .select()
        .from(sessions)
        .where(and(eq(sessions.id, key), gt(sessions.expiresAt, now), isNull(sessions.revokedAt)))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      return {
        userId: row.userId,
        createdAt: row.createdAt,
        ip: row.ip,
        userAgent: row.userAgent,
      } satisfies SessionRecord;
    },

    async set(key, value, ttlSeconds) {
      const now = clock.now();
      const expiresAt = now + ttlSeconds * 1000;
      await db
        .handle()
        .insert(sessions)
        .values({
          id: key,
          userId: value.userId,
          createdAt: value.createdAt ?? now,
          expiresAt,
          ip: value.ip ?? null,
          userAgent: value.userAgent ?? null,
          revokedAt: null,
        })
        .onConflictDoUpdate({
          target: sessions.id,
          set: {
            userId: value.userId,
            expiresAt,
            ip: value.ip ?? null,
            userAgent: value.userAgent ?? null,
            revokedAt: null,
          },
        });
    },

    async delete(key) {
      const now = clock.now();
      await db.handle().update(sessions).set({ revokedAt: now }).where(eq(sessions.id, key));
    },

    async deleteByPrefix(prefix) {
      const now = clock.now();
      await db
        .handle()
        .update(sessions)
        .set({ revokedAt: now })
        .where(like(sessions.id, `${prefix}%`));
    },
  };
}
