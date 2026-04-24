import { sha256 } from "@noble/hashes/sha2";
import { and, eq, gt, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

import { passwordResets } from "../db/schema";
import type { Ctx } from "../platform/ports";

export const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const TOKEN_BYTES = 32;

function b64url(u8: Uint8Array): string {
  return Buffer.from(u8).toString("base64url");
}

export function hashResetToken(token: string): string {
  return b64url(sha256(new TextEncoder().encode(token)));
}

export async function createPasswordReset(
  ctx: Ctx,
  userId: string,
): Promise<{ token: string; expiresAt: number }> {
  const token = b64url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)));
  const tokenHash = hashResetToken(token);
  const expiresAt = ctx.clock.now() + RESET_TTL_MS;
  await ctx.db.handle().insert(passwordResets).values({
    id: nanoid(),
    userId,
    tokenHash,
    expiresAt,
    usedAt: null,
  });
  return { token, expiresAt };
}

export async function consumePasswordReset(
  ctx: Ctx,
  token: string,
): Promise<{ userId: string } | null> {
  const tokenHash = hashResetToken(token);
  const now = ctx.clock.now();
  const rows = await ctx.db
    .handle()
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.tokenHash, tokenHash),
        gt(passwordResets.expiresAt, now),
        isNull(passwordResets.usedAt),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  await ctx.db
    .handle()
    .update(passwordResets)
    .set({ usedAt: now })
    .where(eq(passwordResets.id, row.id));
  return { userId: row.userId };
}
