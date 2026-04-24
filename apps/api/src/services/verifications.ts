import { and, desc, eq, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

import { applications, verifications } from "../db/schema";
import type { VerificationStatus } from "../db/enums";
import type { Ctx } from "../platform/ports";

export interface VerificationRecord {
  id: string;
  code: string;
  studentId: string;
  applicationId: string | null;
  bankId: string | null;
  guardianId: string | null;
  requestedAmount: number;
  verifiedAmount: number | null;
  currency: string;
  status: VerificationStatus;
  rejectionReason: string | null;
  submittedAt: number | null;
  decidedAt: number | null;
  verifiedAt: number | null;
}

export interface CreateVerificationInput {
  studentId: string;
  applicationId?: string | null;
  bankId?: string | null;
  guardianId?: string | null;
  requestedAmount: number;
  currency: string;
}

export interface VerificationDecisionInput {
  decision: "verified" | "rejected";
  verifiedAmount?: number | null;
  rejectionReason?: string | null;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  for (const b of bytes) code += chars[b % chars.length];
  return `VF-${code}`;
}

export async function createVerification(
  ctx: Ctx,
  input: CreateVerificationInput,
): Promise<VerificationRecord> {
  const id = nanoid();
  const code = generateCode();
  const now = ctx.clock.now();
  const row = {
    id,
    code,
    studentId: input.studentId,
    applicationId: input.applicationId ?? null,
    bankId: input.bankId ?? null,
    guardianId: input.guardianId ?? null,
    requestedAmount: input.requestedAmount,
    verifiedAmount: null,
    currency: input.currency.toUpperCase(),
    status: "pending_submission" as const,
    rejectionReason: null,
    submittedAt: null,
    decidedAt: null,
    verifiedAt: null,
  };
  await ctx.db.handle().insert(verifications).values(row);
  return toRecord(row);
}

export async function findVerificationById(
  ctx: Ctx,
  id: string,
): Promise<VerificationRecord | null> {
  const rows = await ctx.db
    .handle()
    .select()
    .from(verifications)
    .where(eq(verifications.id, id))
    .limit(1);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function findVerificationByCode(
  ctx: Ctx,
  code: string,
): Promise<VerificationRecord | null> {
  const rows = await ctx.db
    .handle()
    .select()
    .from(verifications)
    .where(eq(verifications.code, code.toUpperCase()))
    .limit(1);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function submitVerification(
  ctx: Ctx,
  id: string,
): Promise<VerificationRecord> {
  const v = await findVerificationById(ctx, id);
  if (!v) throw new (await import("../lib/errors")).NotFoundError("verification");
  if (v.status !== "pending_submission") {
    throw new (await import("../lib/errors")).AppError(
      409,
      "invalid_transition",
      `cannot submit verification in status "${v.status}"`,
    );
  }

  const now = ctx.clock.now();
  await ctx.db
    .handle()
    .update(verifications)
    .set({ status: "pending", submittedAt: now })
    .where(eq(verifications.id, id));

  return { ...v, status: "pending", submittedAt: now };
}

export async function decideVerification(
  ctx: Ctx,
  id: string,
  input: VerificationDecisionInput,
): Promise<VerificationRecord> {
  const v = await findVerificationById(ctx, id);
  if (!v) throw new (await import("../lib/errors")).NotFoundError("verification");

  const allowedForDecision: VerificationStatus[] = ["pending", "under_review", "more_info_needed"];
  if (!allowedForDecision.includes(v.status)) {
    throw new (await import("../lib/errors")).AppError(
      409,
      "invalid_transition",
      `cannot decide verification in status "${v.status}"`,
    );
  }

  const now = ctx.clock.now();
  const updateValues: Record<string, unknown> = {
    status: input.decision,
    decidedAt: now,
  };
  if (input.decision === "verified") {
    updateValues.verifiedAmount = input.verifiedAmount ?? v.requestedAmount;
    updateValues.verifiedAt = now;
  }
  if (input.decision === "rejected" && input.rejectionReason) {
    updateValues.rejectionReason = input.rejectionReason;
  }

  await ctx.db
    .handle()
    .update(verifications)
    .set(updateValues)
    .where(eq(verifications.id, id));

  if (v.applicationId) {
    const verificationStatus = input.decision === "verified" ? "verified" : "rejected";
    await ctx.db
      .handle()
      .update(applications)
      .set({ verificationStatus })
      .where(eq(applications.id, v.applicationId));
  }

  return {
    ...v,
    status: input.decision as VerificationStatus,
    decidedAt: now,
    verifiedAmount: input.decision === "verified" ? (input.verifiedAmount ?? v.requestedAmount) : v.verifiedAmount,
    verifiedAt: input.decision === "verified" ? now : v.verifiedAt,
    rejectionReason: input.decision === "rejected" ? (input.rejectionReason ?? v.rejectionReason) : v.rejectionReason,
  };
}

export async function listVerifications(
  ctx: Ctx,
  filters: {
    studentId?: string;
    bankId?: string;
    status?: VerificationStatus;
    cursor?: number;
    limit?: number;
  },
): Promise<{ items: VerificationRecord[]; nextCursor: string | null; hasMore: boolean }> {
  const limit = Math.min(filters.limit ?? 20, 100);

  const conditions = [];
  if (filters.studentId) conditions.push(eq(verifications.studentId, filters.studentId));
  if (filters.bankId) conditions.push(eq(verifications.bankId, filters.bankId));
  if (filters.status) conditions.push(eq(verifications.status, filters.status));
  if (filters.cursor) conditions.push(lt(verifications.submittedAt, filters.cursor));

  const rows = await ctx.db
    .handle()
    .select()
    .from(verifications)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(verifications.submittedAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(toRecord);
  const nextCursor =
    hasMore && items.length > 0 ? String(items[items.length - 1].submittedAt ?? 0) : null;

  return { items, nextCursor, hasMore };
}

function toRecord(row: typeof verifications.$inferSelect): VerificationRecord {
  return {
    id: row.id,
    code: row.code,
    studentId: row.studentId,
    applicationId: row.applicationId,
    bankId: row.bankId,
    guardianId: row.guardianId,
    requestedAmount: row.requestedAmount,
    verifiedAmount: row.verifiedAmount,
    currency: row.currency,
    status: row.status as VerificationStatus,
    rejectionReason: row.rejectionReason,
    submittedAt: row.submittedAt,
    decidedAt: row.decidedAt,
    verifiedAt: row.verifiedAt,
  };
}
