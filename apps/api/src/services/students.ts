import { and, desc, eq, isNull, like, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

import { students } from "../db/schema";
import type { Ctx } from "../platform/ports";

export interface StudentRecord {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  country: string | null;
  nationality: string | null;
  gpa: number | null;
  university: string | null;
  intendedStudy: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreateStudentInput {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  country?: string | null;
  nationality?: string | null;
  gpa?: number | null;
  university?: string | null;
  intendedStudy?: string | null;
}

export interface UpdateStudentInput {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  country?: string | null;
  nationality?: string | null;
  gpa?: number | null;
  university?: string | null;
  intendedStudy?: string | null;
}

export async function createStudent(ctx: Ctx, input: CreateStudentInput): Promise<StudentRecord> {
  const id = nanoid();
  const now = ctx.clock.now();
  const row = {
    id,
    userId: input.userId,
    firstName: input.firstName ?? null,
    lastName: input.lastName ?? null,
    fullName: input.fullName ?? null,
    country: input.country ?? null,
    nationality: input.nationality ?? null,
    gpa: input.gpa ?? null,
    university: input.university ?? null,
    intendedStudy: input.intendedStudy ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await ctx.db.handle().insert(students).values(row);
  return toRecord(row);
}

export async function findStudentById(ctx: Ctx, id: string): Promise<StudentRecord | null> {
  const rows = await ctx.db
    .handle()
    .select()
    .from(students)
    .where(and(eq(students.id, id), isNull(students.deletedAt)))
    .limit(1);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function findStudentByUserId(ctx: Ctx, userId: string): Promise<StudentRecord | null> {
  const rows = await ctx.db
    .handle()
    .select()
    .from(students)
    .where(and(eq(students.userId, userId), isNull(students.deletedAt)))
    .limit(1);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function updateStudent(
  ctx: Ctx,
  id: string,
  input: UpdateStudentInput,
): Promise<StudentRecord | null> {
  const now = ctx.clock.now();
  await ctx.db
    .handle()
    .update(students)
    .set({ ...input, updatedAt: now })
    .where(and(eq(students.id, id), isNull(students.deletedAt)));
  return findStudentById(ctx, id);
}

export async function listStudents(
  ctx: Ctx,
  filters: { cursor?: number; limit?: number; q?: string },
): Promise<{ items: StudentRecord[]; nextCursor: string | null; hasMore: boolean }> {
  const limit = Math.min(filters.limit ?? 20, 100);

  const conditions = [isNull(students.deletedAt)];
  if (filters.cursor) conditions.push(lt(students.createdAt, filters.cursor));
  if (filters.q) {
    conditions.push(like(students.fullName, `%${filters.q}%`));
  }

  const rows = await ctx.db
    .handle()
    .select()
    .from(students)
    .where(and(...conditions))
    .orderBy(desc(students.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(toRecord);
  const nextCursor = hasMore && items.length > 0 ? String(items[items.length - 1].createdAt) : null;

  return { items, nextCursor, hasMore };
}

function toRecord(row: typeof students.$inferSelect): StudentRecord {
  return {
    id: row.id,
    userId: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
    fullName: row.fullName,
    country: row.country,
    nationality: row.nationality,
    gpa: row.gpa,
    university: row.university,
    intendedStudy: row.intendedStudy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
