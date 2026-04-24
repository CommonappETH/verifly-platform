import { Hono } from "hono";
import { z } from "zod";

import type { AppVariables } from "../../app";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../lib/validate";
import { ok, created, empty } from "../../lib/responses";
import { ForbiddenError, NotFoundError } from "../../lib/errors";
import { documentKinds } from "../../db/enums";
import {
  createDocument,
  findDocumentById,
  completeDocumentUpload,
  getDocumentWithDownloadUrl,
  reviewDocument,
  softDeleteDocument,
} from "../../services/documents";
import { audit } from "../../services/audit";

const createDocumentSchema = z
  .object({
    kind: z.enum(documentKinds),
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(100),
    sizeBytes: z.number().int().positive(),
    applicationId: z.string().max(100).optional(),
    verificationId: z.string().max(100).optional(),
  })
  .strict();

const reviewDocumentSchema = z
  .object({
    status: z.enum(["approved", "needs_replacement"]),
  })
  .strict();

export function createDocumentsRouter(): Hono<{ Variables: AppVariables }> {
  const router = new Hono<{ Variables: AppVariables }>();

  router.post("/", requireAuth(), validate(createDocumentSchema, "body"), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const input = c.get("validated_body") as z.infer<typeof createDocumentSchema>;

    const result = await createDocument(ctx, {
      ownerId: user.id,
      kind: input.kind,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      applicationId: input.applicationId,
      verificationId: input.verificationId,
    });

    await audit(ctx, {
      actorUserId: user.id,
      action: "document.create",
      entityType: "document",
      entityId: result.document.id,
      metadata: { kind: input.kind, fileName: input.fileName },
    });

    return created(c, {
      id: result.document.id,
      uploadUrl: result.uploadUrl,
      uploadHeaders: result.uploadHeaders,
    });
  });

  router.post("/:id/complete", requireAuth(), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const id = c.req.param("id");

    const doc = await findDocumentById(ctx, id);
    if (!doc) throw new NotFoundError("document");
    if (doc.ownerId !== user.id && user.role !== "admin") throw new ForbiddenError();

    const updated = await completeDocumentUpload(ctx, id);

    await audit(ctx, {
      actorUserId: user.id,
      action: "document.complete",
      entityType: "document",
      entityId: id,
    });

    return ok(c, updated);
  });

  router.get("/:id", requireAuth(), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const id = c.req.param("id");

    const doc = await findDocumentById(ctx, id);
    if (!doc) throw new NotFoundError("document");

    await assertDocumentReadAccess(user, doc);

    const result = await getDocumentWithDownloadUrl(ctx, id);
    return ok(c, { ...result.document, downloadUrl: result.downloadUrl });
  });

  router.patch("/:id/review", requireAuth(), validate(reviewDocumentSchema, "body"), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const id = c.req.param("id");

    if (!["admin", "university", "bank"].includes(user.role)) throw new ForbiddenError();

    const input = c.get("validated_body") as z.infer<typeof reviewDocumentSchema>;
    const updated = await reviewDocument(ctx, id, input);

    await audit(ctx, {
      actorUserId: user.id,
      action: "document.review",
      entityType: "document",
      entityId: id,
      metadata: { status: input.status },
    });

    return ok(c, updated);
  });

  router.delete("/:id", requireAuth(), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const id = c.req.param("id");

    const doc = await findDocumentById(ctx, id);
    if (!doc) throw new NotFoundError("document");
    if (doc.ownerId !== user.id && user.role !== "admin") throw new ForbiddenError();

    await softDeleteDocument(ctx, id);

    await audit(ctx, {
      actorUserId: user.id,
      action: "document.delete",
      entityType: "document",
      entityId: id,
    });

    return empty(c);
  });

  return router;
}

function assertDocumentReadAccess(
  user: { id: string; role: string },
  doc: { ownerId: string },
): void {
  if (user.role === "admin") return;
  if (doc.ownerId === user.id) return;
  if (["university", "bank", "counselor"].includes(user.role)) return;
  throw new ForbiddenError();
}
