import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { guardians } from "../db/schema";
import type { Ctx } from "../platform/ports";

export interface GuardianRecord {
  id: string;
  studentId: string;
  fullName: string;
  relationship: string | null;
  email: string | null;
  phone: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreateGuardianInput {
  studentId: string;
  fullName: string;
  relationship?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface UpdateGuardianInput {
  fullName?: string;
  relationship?: string | null;
  email?: string | null;
  phone?: string | null;
}

export async function createGuardian(
  ctx: Ctx,
  input: CreateGuardianInput,
): Promise<GuardianRecord> {
  const id = nanoid();
  const now = ctx.clock.now();
  const row = {
    id,
    studentId: input.studentId,
    fullName: input.fullName,
    relationship: input.relationship ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await ctx.db.handle().insert(guardians).values(row);
  return toRecord(row);
}

export async function findGuardianById(
  ctx: Ctx,
  id: string,
): Promise<GuardianRecord | null> {
  const rows = await ctx.db
    .handle()
    .select()
    .from(guardians)
    .where(eq(guardians.id, id))
    .limit(1);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function listGuardiansByStudent(
  ctx: Ctx,
  studentId: string,
): Promise<GuardianRecord[]> {
  const rows = await ctx.db
    .handle()
    .select()
    .from(guardians)
    .where(eq(guardians.studentId, studentId));
  return rows.map(toRecord);
}

export async function updateGuardian(
  ctx: Ctx,
  id: string,
  input: UpdateGuardianInput,
): Promise<GuardianRecord | null> {
  const now = ctx.clock.now();
  await ctx.db
    .handle()
    .update(guardians)
    .set({ ...input, updatedAt: now })
    .where(eq(guardians.id, id));
  return findGuardianById(ctx, id);
}

export async function deleteGuardian(ctx: Ctx, id: string): Promise<void> {
  await ctx.db.handle().delete(guardians).where(eq(guardians.id, id));
}

function toRecord(
  row: typeof guardians.$inferSelect,
): GuardianRecord {
  return {
    id: row.id,
    studentId: row.studentId,
    fullName: row.fullName,
    relationship: row.relationship,
    email: row.email,
    phone: row.phone,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
