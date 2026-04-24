import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { auditLog } from "../db/schema";
import type { Ctx } from "../platform/ports";

export interface AuditInput {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

export interface AuditRecord {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: number;
  ip: string | null;
}

export async function audit(ctx: Ctx, input: AuditInput): Promise<void> {
  const id = nanoid();
  await ctx.db.handle().insert(auditLog).values({
    id,
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    createdAt: ctx.clock.now(),
    ip: input.ip ?? null,
  });
}

export async function listAuditEntries(
  ctx: Ctx,
  filters: { entityType?: string; entityId?: string; cursor?: number; limit?: number },
): Promise<{ items: AuditRecord[]; nextCursor: string | null; hasMore: boolean }> {
  const limit = Math.min(filters.limit ?? 50, 100);

  const conditions = [];
  if (filters.entityType) conditions.push(eq(auditLog.entityType, filters.entityType));
  if (filters.entityId) conditions.push(eq(auditLog.entityId, filters.entityId));
  if (filters.cursor) {
    const { lt } = await import("drizzle-orm");
    conditions.push(lt(auditLog.createdAt, filters.cursor));
  }

  const rows = await ctx.db
    .handle()
    .select()
    .from(auditLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(parseAuditRow);
  const nextCursor = hasMore && items.length > 0 ? String(items[items.length - 1].createdAt) : null;

  return { items, nextCursor, hasMore };
}

function parseAuditRow(row: typeof auditLog.$inferSelect): AuditRecord {
  let metadata: Record<string, unknown> | null = null;
  if (row.metadata) {
    try {
      metadata = JSON.parse(row.metadata) as Record<string, unknown>;
    } catch {
      metadata = null;
    }
  }
  return {
    id: row.id,
    actorUserId: row.actorUserId,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata,
    createdAt: row.createdAt,
    ip: row.ip,
  };
}
