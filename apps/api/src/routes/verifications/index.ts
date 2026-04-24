import { Hono } from "hono";
import { z } from "zod";

import type { AppVariables } from "../../app";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../lib/validate";
import { ok, created, paginated } from "../../lib/responses";
import { ForbiddenError, NotFoundError } from "../../lib/errors";
import { verificationStatuses } from "../../db/enums";
import type { VerificationStatus } from "../../db/enums";
import {
  createVerification,
  findVerificationById,
  findVerificationByCode,
  submitVerification,
  decideVerification,
  listVerifications,
} from "../../services/verifications";
import { findStudentByUserId } from "../../services/students";
import { getUniversityIdForUser } from "../../services/applications";
import { audit } from "../../services/audit";
import { bankUsers } from "../../db/schema";
import { eq } from "drizzle-orm";

const createVerificationSchema = z
  .object({
    applicationId: z.string().max(100).optional(),
    bankId: z.string().max(100).optional(),
    guardianId: z.string().max(100).optional(),
    requestedAmount: z.number().int().positive(),
    currency: z.string().length(3),
  })
  .strict();

const decisionSchema = z
  .object({
    decision: z.enum(["verified", "rejected"]),
    verifiedAmount: z.number().int().positive().optional(),
    rejectionReason: z.string().max(2000).optional(),
  })
  .strict();

const listVerificationsQuerySchema = z.object({
  status: z.enum(verificationStatuses).optional(),
  cursor: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export function createVerificationsRouter(): Hono<{ Variables: AppVariables }> {
  const router = new Hono<{ Variables: AppVariables }>();

  router.post("/", requireAuth(), validate(createVerificationSchema, "body"), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    if (user.role !== "student" && user.role !== "counselor") {
      throw new ForbiddenError("only students or counselors can create verifications");
    }

    let studentId: string;
    if (user.role === "student") {
      const student = await findStudentByUserId(ctx, user.id);
      if (!student) throw new NotFoundError("student profile required");
      studentId = student.id;
    } else {
      throw new ForbiddenError("counselor verification creation requires a studentId (not yet implemented)");
    }

    const input = c.get("validated_body") as z.infer<typeof createVerificationSchema>;
    const verification = await createVerification(ctx, {
      studentId,
      applicationId: input.applicationId,
      bankId: input.bankId,
      guardianId: input.guardianId,
      requestedAmount: input.requestedAmount,
      currency: input.currency,
    });

    await audit(ctx, {
      actorUserId: user.id,
      action: "verification.create",
      entityType: "verification",
      entityId: verification.id,
      metadata: { code: verification.code },
    });

    return created(c, verification);
  });

  router.post("/:id/submit", requireAuth(), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const id = c.req.param("id");

    const v = await findVerificationById(ctx, id);
    if (!v) throw new NotFoundError("verification");

    if (user.role === "student") {
      const student = await findStudentByUserId(ctx, user.id);
      if (!student || student.id !== v.studentId) throw new ForbiddenError();
    } else if (user.role !== "admin") {
      throw new ForbiddenError();
    }

    const updated = await submitVerification(ctx, id);

    await audit(ctx, {
      actorUserId: user.id,
      action: "verification.submit",
      entityType: "verification",
      entityId: id,
    });

    return ok(c, updated);
  });

  router.get("/:id", requireAuth(), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const id = c.req.param("id");

    const v = await findVerificationById(ctx, id);
    if (!v) throw new NotFoundError("verification");

    await assertVerificationReadAccess(ctx, user, v);
    return ok(c, v);
  });

  router.patch("/:id/decision", requireAuth(), requireRole("bank"), validate(decisionSchema, "body"), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const id = c.req.param("id");
    const input = c.get("validated_body") as z.infer<typeof decisionSchema>;

    const v = await findVerificationById(ctx, id);
    if (!v) throw new NotFoundError("verification");

    const bankUser = await getBankIdForUser(ctx, user.id);
    if (!bankUser || bankUser !== v.bankId) throw new ForbiddenError("not the assigned bank");

    const updated = await decideVerification(ctx, id, input);

    await audit(ctx, {
      actorUserId: user.id,
      action: "verification.decision",
      entityType: "verification",
      entityId: id,
      metadata: { decision: input.decision, verifiedAmount: input.verifiedAmount },
    });

    return ok(c, updated);
  });

  router.get("/", requireAuth(), validate(listVerificationsQuerySchema, "query"), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const query = c.get("validated_query") as z.infer<typeof listVerificationsQuerySchema>;

    const filters = await buildListFilters(ctx, user, query);
    const result = await listVerifications(ctx, filters);

    return paginated(c, result.items, {
      cursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  });

  router.get("/lookup/:code", requireAuth(), requireRole("bank"), async (c) => {
    const ctx = c.get("ctx");
    const code = c.req.param("code");
    const v = await findVerificationByCode(ctx, code);
    if (!v) throw new NotFoundError("verification");
    return ok(c, v);
  });

  return router;
}

async function getBankIdForUser(
  ctx: import("../../platform/ports").Ctx,
  userId: string,
): Promise<string | null> {
  const rows = await ctx.db
    .handle()
    .select({ bankId: bankUsers.bankId })
    .from(bankUsers)
    .where(eq(bankUsers.userId, userId))
    .limit(1);
  return rows[0]?.bankId ?? null;
}

async function assertVerificationReadAccess(
  ctx: import("../../platform/ports").Ctx,
  user: { id: string; role: string },
  v: { studentId: string; bankId: string | null; applicationId: string | null },
): Promise<void> {
  if (user.role === "admin") return;

  if (user.role === "student") {
    const student = await findStudentByUserId(ctx, user.id);
    if (student && student.id === v.studentId) return;
    throw new ForbiddenError();
  }

  if (user.role === "bank") {
    const bankId = await getBankIdForUser(ctx, user.id);
    if (bankId && bankId === v.bankId) return;
    throw new ForbiddenError();
  }

  if (user.role === "university") {
    if (v.applicationId) {
      const { findApplicationById } = await import("../../services/applications");
      const app = await findApplicationById(ctx, v.applicationId);
      if (app) {
        const uniId = await getUniversityIdForUser(ctx, user.id);
        if (uniId === app.universityId) return;
      }
    }
    throw new ForbiddenError();
  }

  if (user.role === "counselor") return;

  throw new ForbiddenError();
}

async function buildListFilters(
  ctx: import("../../platform/ports").Ctx,
  user: { id: string; role: string },
  query: { status?: string; cursor?: number; limit?: number },
) {
  const base: {
    studentId?: string;
    bankId?: string;
    status?: VerificationStatus;
    cursor?: number;
    limit?: number;
  } = {
    status: query.status as VerificationStatus | undefined,
    cursor: query.cursor,
    limit: query.limit,
  };

  if (user.role === "admin" || user.role === "counselor") return base;

  if (user.role === "student") {
    const student = await findStudentByUserId(ctx, user.id);
    if (!student) return { ...base, studentId: "__none__" };
    return { ...base, studentId: student.id };
  }

  if (user.role === "bank") {
    const bankId = await getBankIdForUser(ctx, user.id);
    if (!bankId) return { ...base, bankId: "__none__" };
    return { ...base, bankId };
  }

  return base;
}
