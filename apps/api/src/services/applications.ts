import { and, desc, eq, inArray, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

import { applications, students, universityUsers } from "../db/schema";
import type { ApplicationStatus, UserRole } from "../db/enums";
import type { Ctx } from "../platform/ports";
import { validateTransition } from "./application-state";

export interface ApplicationRecord {
  id: string;
  studentId: string;
  universityId: string;
  program: string | null;
  status: ApplicationStatus;
  verificationStatus: string | null;
  documentStatus: string | null;
  decisionStatus: string | null;
  applicantType: string | null;
  submittedAt: number | null;
  updatedAt: number;
}

export interface CreateApplicationInput {
  studentId: string;
  universityId: string;
  program?: string | null;
}

export async function createApplication(
  ctx: Ctx,
  input: CreateApplicationInput,
): Promise<ApplicationRecord> {
  const id = nanoid();
  const now = ctx.clock.now();
  const row = {
    id,
    studentId: input.studentId,
    universityId: input.universityId,
    program: input.program ?? null,
    status: "draft" as const,
    verificationStatus: null,
    documentStatus: null,
    decisionStatus: null,
    applicantType: null,
    submittedAt: null,
    updatedAt: now,
  };
  await ctx.db.handle().insert(applications).values(row);
  return toRecord(row);
}

export async function findApplicationById(
  ctx: Ctx,
  id: string,
): Promise<ApplicationRecord | null> {
  const rows = await ctx.db
    .handle()
    .select()
    .from(applications)
    .where(eq(applications.id, id))
    .limit(1);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function transitionApplication(
  ctx: Ctx,
  id: string,
  targetStatus: ApplicationStatus,
  actorRole: UserRole,
): Promise<ApplicationRecord> {
  const app = await findApplicationById(ctx, id);
  if (!app) throw new (await import("../lib/errors")).NotFoundError("application");

  validateTransition(app.status, targetStatus, actorRole);

  const now = ctx.clock.now();
  const updateValues: Record<string, unknown> = {
    status: targetStatus,
    updatedAt: now,
  };
  if (targetStatus === "submitted" && !app.submittedAt) {
    updateValues.submittedAt = now;
  }

  await ctx.db
    .handle()
    .update(applications)
    .set(updateValues)
    .where(eq(applications.id, id));

  return { ...app, status: targetStatus, updatedAt: now };
}

export async function listApplications(
  ctx: Ctx,
  filters: {
    studentId?: string;
    universityId?: string;
    status?: ApplicationStatus;
    cursor?: number;
    limit?: number;
  },
): Promise<{ items: ApplicationRecord[]; nextCursor: string | null; hasMore: boolean }> {
  const limit = Math.min(filters.limit ?? 20, 100);

  const conditions = [];
  if (filters.studentId) conditions.push(eq(applications.studentId, filters.studentId));
  if (filters.universityId) conditions.push(eq(applications.universityId, filters.universityId));
  if (filters.status) conditions.push(eq(applications.status, filters.status));
  if (filters.cursor) conditions.push(lt(applications.updatedAt, filters.cursor));

  const rows = await ctx.db
    .handle()
    .select()
    .from(applications)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(applications.updatedAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(toRecord);
  const nextCursor = hasMore && items.length > 0 ? String(items[items.length - 1].updatedAt) : null;

  return { items, nextCursor, hasMore };
}

export async function getStudentIdsForCounselor(
  _ctx: Ctx,
  _counselorUserId: string,
): Promise<string[]> {
  // Phase 7 note: no explicit counselor-student mapping table exists.
  // For now, counselors have broad read access. A future phase may add
  // a school-based mapping (counselor.schoolName ↔ student.university).
  return [];
}

export async function getUniversityIdForUser(
  ctx: Ctx,
  userId: string,
): Promise<string | null> {
  const rows = await ctx.db
    .handle()
    .select({ universityId: universityUsers.universityId })
    .from(universityUsers)
    .where(eq(universityUsers.userId, userId))
    .limit(1);
  return rows[0]?.universityId ?? null;
}

function toRecord(row: typeof applications.$inferSelect): ApplicationRecord {
  return {
    id: row.id,
    studentId: row.studentId,
    universityId: row.universityId,
    program: row.program,
    status: row.status as ApplicationStatus,
    verificationStatus: row.verificationStatus,
    documentStatus: row.documentStatus,
    decisionStatus: row.decisionStatus,
    applicantType: row.applicantType,
    submittedAt: row.submittedAt,
    updatedAt: row.updatedAt,
  };
}
