import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

import { users } from "../db/schema";
import type { UserRole } from "../db/enums";
import type { Ctx } from "../platform/ports";

export interface UserRecord {
  id: string;
  email: string;
  role: UserRole;
  name: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface UserWithHash extends UserRecord {
  passwordHash: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findUserByEmail(
  ctx: Ctx,
  email: string,
): Promise<UserWithHash | null> {
  const rows = await ctx.db
    .handle()
    .select()
    .from(users)
    .where(and(eq(users.email, normalizeEmail(email)), isNull(users.deletedAt)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    name: row.name,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function findUserById(ctx: Ctx, id: string): Promise<UserRecord | null> {
  const rows = await ctx.db
    .handle()
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string | null;
}

export async function createUser(ctx: Ctx, input: CreateUserInput): Promise<UserRecord> {
  const id = nanoid();
  const now = ctx.clock.now();
  await ctx.db.handle().insert(users).values({
    id,
    email: normalizeEmail(input.email),
    passwordHash: input.passwordHash,
    role: input.role,
    name: input.name,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });
  return {
    id,
    email: normalizeEmail(input.email),
    role: input.role,
    name: input.name,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updatePasswordHash(
  ctx: Ctx,
  userId: string,
  passwordHash: string,
): Promise<void> {
  await ctx.db
    .handle()
    .update(users)
    .set({ passwordHash, updatedAt: ctx.clock.now() })
    .where(eq(users.id, userId));
}

export function toPublicUser(u: UserRecord): {
  id: string;
  email: string;
  role: UserRole;
  name: string | null;
} {
  return { id: u.id, email: u.email, role: u.role, name: u.name };
}
