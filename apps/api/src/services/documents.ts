import { and, desc, eq, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

import { documents } from "../db/schema";
import type { DocumentKind, DocumentStatus } from "../db/enums";
import type { Ctx } from "../platform/ports";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"];

export interface DocumentRecord {
  id: string;
  ownerId: string;
  kind: DocumentKind;
  status: DocumentStatus;
  applicationId: string | null;
  verificationId: string | null;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: number;
  reviewedAt: number | null;
}

export interface CreateDocumentInput {
  ownerId: string;
  kind: DocumentKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  applicationId?: string | null;
  verificationId?: string | null;
}

export interface ReviewDocumentInput {
  status: "approved" | "needs_replacement";
}

export async function createDocument(
  ctx: Ctx,
  input: CreateDocumentInput,
): Promise<{ document: DocumentRecord; uploadUrl: string; uploadHeaders: Record<string, string> }> {
  if (!ALLOWED_MIME_TYPES.includes(input.mimeType)) {
    throw new (await import("../lib/errors")).ValidationError("unsupported mime type", {
      allowed: ALLOWED_MIME_TYPES,
    });
  }
  if (input.sizeBytes > MAX_FILE_SIZE) {
    throw new (await import("../lib/errors")).ValidationError(
      `file size exceeds ${MAX_FILE_SIZE} bytes`,
    );
  }

  const id = nanoid();
  const storageKey = `documents/${input.ownerId}/${id}/${input.fileName}`;
  const now = ctx.clock.now();

  const row = {
    id,
    ownerId: input.ownerId,
    kind: input.kind,
    status: "missing" as const,
    applicationId: input.applicationId ?? null,
    verificationId: input.verificationId ?? null,
    storageKey,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    uploadedAt: now,
    reviewedAt: null,
  };
  await ctx.db.handle().insert(documents).values(row);

  const presigned = await ctx.storage.presignUpload({
    key: storageKey,
    mimeType: input.mimeType,
    maxBytes: input.sizeBytes,
    expiresInSec: 3600,
  });

  return {
    document: toRecord(row),
    uploadUrl: presigned.url,
    uploadHeaders: presigned.headers,
  };
}

export async function findDocumentById(
  ctx: Ctx,
  id: string,
): Promise<DocumentRecord | null> {
  const rows = await ctx.db
    .handle()
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function completeDocumentUpload(
  ctx: Ctx,
  id: string,
): Promise<DocumentRecord> {
  const doc = await findDocumentById(ctx, id);
  if (!doc) throw new (await import("../lib/errors")).NotFoundError("document");

  const head = await ctx.storage.head(doc.storageKey);
  if (!head) {
    throw new (await import("../lib/errors")).ValidationError(
      "upload not found at storage key; upload may not be complete",
    );
  }

  const now = ctx.clock.now();
  await ctx.db
    .handle()
    .update(documents)
    .set({ status: "uploaded", uploadedAt: now })
    .where(eq(documents.id, id));

  return { ...doc, status: "uploaded", uploadedAt: now };
}

export async function getDocumentWithDownloadUrl(
  ctx: Ctx,
  id: string,
): Promise<{ document: DocumentRecord; downloadUrl: string }> {
  const doc = await findDocumentById(ctx, id);
  if (!doc) throw new (await import("../lib/errors")).NotFoundError("document");

  const downloadUrl = await ctx.storage.presignDownload(doc.storageKey, 3600);
  return { document: doc, downloadUrl };
}

export async function reviewDocument(
  ctx: Ctx,
  id: string,
  input: ReviewDocumentInput,
): Promise<DocumentRecord> {
  const doc = await findDocumentById(ctx, id);
  if (!doc) throw new (await import("../lib/errors")).NotFoundError("document");

  const now = ctx.clock.now();
  await ctx.db
    .handle()
    .update(documents)
    .set({ status: input.status, reviewedAt: now })
    .where(eq(documents.id, id));

  return { ...doc, status: input.status, reviewedAt: now };
}

export async function softDeleteDocument(ctx: Ctx, id: string): Promise<void> {
  const doc = await findDocumentById(ctx, id);
  if (!doc) throw new (await import("../lib/errors")).NotFoundError("document");

  await ctx.storage.delete(doc.storageKey);
  await ctx.db.handle().delete(documents).where(eq(documents.id, id));
}

export async function listDocuments(
  ctx: Ctx,
  filters: {
    ownerId?: string;
    applicationId?: string;
    verificationId?: string;
    cursor?: number;
    limit?: number;
  },
): Promise<{ items: DocumentRecord[]; nextCursor: string | null; hasMore: boolean }> {
  const limit = Math.min(filters.limit ?? 20, 100);

  const conditions = [];
  if (filters.ownerId) conditions.push(eq(documents.ownerId, filters.ownerId));
  if (filters.applicationId) conditions.push(eq(documents.applicationId, filters.applicationId));
  if (filters.verificationId) conditions.push(eq(documents.verificationId, filters.verificationId));
  if (filters.cursor) conditions.push(lt(documents.uploadedAt, filters.cursor));

  const rows = await ctx.db
    .handle()
    .select()
    .from(documents)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(documents.uploadedAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(toRecord);
  const nextCursor = hasMore && items.length > 0 ? String(items[items.length - 1].uploadedAt) : null;

  return { items, nextCursor, hasMore };
}

function toRecord(row: typeof documents.$inferSelect): DocumentRecord {
  return {
    id: row.id,
    ownerId: row.ownerId,
    kind: row.kind as DocumentKind,
    status: row.status as DocumentStatus,
    applicationId: row.applicationId,
    verificationId: row.verificationId,
    storageKey: row.storageKey,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    uploadedAt: row.uploadedAt,
    reviewedAt: row.reviewedAt,
  };
}
