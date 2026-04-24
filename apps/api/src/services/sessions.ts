import { sha256 } from "@noble/hashes/sha2";
import { eq } from "drizzle-orm";

import { sessions as sessionsTable } from "../db/schema";
import type { Ctx, SessionRecord } from "../platform/ports";

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const TOKEN_BYTES = 32;

function base64url(u8: Uint8Array): string {
  return Buffer.from(u8).toString("base64url");
}

function hashToken(token: string): string {
  return base64url(sha256(new TextEncoder().encode(token)));
}

export interface CreateSessionInput {
  userId: string;
  ip: string | null;
  userAgent: string | null;
}

export interface CreateSessionResult {
  token: string;
  expiresAt: number;
}

export async function createSession(
  ctx: Ctx,
  input: CreateSessionInput,
): Promise<CreateSessionResult> {
  const token = base64url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)));
  const key = hashToken(token);
  const now = ctx.clock.now();
  await ctx.sessions.set(
    key,
    {
      userId: input.userId,
      createdAt: now,
      ip: input.ip,
      userAgent: input.userAgent,
    },
    SESSION_TTL_SECONDS,
  );
  return { token, expiresAt: now + SESSION_TTL_SECONDS * 1000 };
}

export async function readSession(ctx: Ctx, token: string): Promise<SessionRecord | null> {
  if (!token) return null;
  return ctx.sessions.get(hashToken(token));
}

export async function revokeSession(ctx: Ctx, token: string): Promise<void> {
  if (!token) return;
  await ctx.sessions.delete(hashToken(token));
}

export async function revokeAllForUser(ctx: Ctx, userId: string): Promise<void> {
  // Session keys are opaque SHA-256 hashes of the token, so the port's
  // deleteByPrefix can't scope by user. Revoke via the db handle instead —
  // still goes through ctx, just a user-scoped batch rather than a key scan.
  await ctx.db
    .handle()
    .update(sessionsTable)
    .set({ revokedAt: ctx.clock.now() })
    .where(eq(sessionsTable.userId, userId));
}

export { hashToken };
