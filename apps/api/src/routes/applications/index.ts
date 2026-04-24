import { Hono } from "hono";
import { z } from "zod";

import type { AppVariables } from "../../app";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../lib/validate";
import { ok, created, paginated } from "../../lib/responses";
import { ForbiddenError, NotFoundError } from "../../lib/errors";
import { applicationStatuses } from "../../db/enums";
import type { ApplicationStatus, UserRole } from "../../db/enums";
import {
  createApplication,
  findApplicationById,
  transitionApplication,
  listApplications,
  getUniversityIdForUser,
} from "../../services/applications";
import { findStudentByUserId } from "../../services/students";
import { audit } from "../../services/audit";

const createApplicationSchema = z
  .object({
    universityId: z.string().min(1).max(100),
    program: z.string().max(200).optional(),
  })
  .strict();

const patchApplicationSchema = z
  .object({
    status: z.enum(applicationStatuses),
  })
  .strict();

const listApplicationsQuerySchema = z.object({
  status: z.enum(applicationStatuses).optional(),
  cursor: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export function createApplicationsRouter(): Hono<{ Variables: AppVariables }> {
  const router = new Hono<{ Variables: AppVariables }>();

  router.post("/", requireAuth(), validate(createApplicationSchema, "body"), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    if (user.role !== "student") throw new ForbiddenError("only students can create applications");

    const student = await findStudentByUserId(ctx, user.id);
    if (!student) throw new NotFoundError("student profile required to create an application");

    const input = c.get("validated_body") as z.infer<typeof createApplicationSchema>;
    const app = await createApplication(ctx, {
      studentId: student.id,
      universityId: input.universityId,
      program: input.program,
    });

    await audit(ctx, {
      actorUserId: user.id,
      action: "application.create",
      entityType: "application",
      entityId: app.id,
      metadata: { universityId: input.universityId },
    });

    return created(c, app);
  });

  router.get("/:id", requireAuth(), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const id = c.req.param("id");

    const app = await findApplicationById(ctx, id);
    if (!app) throw new NotFoundError("application");

    await assertApplicationReadAccess(ctx, user, app);
    return ok(c, app);
  });

  router.patch("/:id", requireAuth(), validate(patchApplicationSchema, "body"), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const id = c.req.param("id");
    const input = c.get("validated_body") as z.infer<typeof patchApplicationSchema>;

    const updated = await transitionApplication(
      ctx,
      id,
      input.status as ApplicationStatus,
      user.role as UserRole,
    );

    await audit(ctx, {
      actorUserId: user.id,
      action: "application.transition",
      entityType: "application",
      entityId: id,
      metadata: { newStatus: input.status },
    });

    return ok(c, updated);
  });

  router.get("/", requireAuth(), validate(listApplicationsQuerySchema, "query"), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const query = c.get("validated_query") as z.infer<typeof listApplicationsQuerySchema>;

    const filters = await buildListFilters(ctx, user, query);
    const result = await listApplications(ctx, filters);

    return paginated(c, result.items, {
      cursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  });

  return router;
}

async function assertApplicationReadAccess(
  ctx: import("../../platform/ports").Ctx,
  user: { id: string; role: string },
  app: { studentId: string; universityId: string },
): Promise<void> {
  if (user.role === "admin") return;
  if (user.role === "counselor") return;

  if (user.role === "student") {
    const student = await findStudentByUserId(ctx, user.id);
    if (student && student.id === app.studentId) return;
    throw new ForbiddenError();
  }

  if (user.role === "university") {
    const uniId = await getUniversityIdForUser(ctx, user.id);
    if (uniId === app.universityId) return;
    throw new ForbiddenError();
  }

  throw new ForbiddenError();
}

async function buildListFilters(
  ctx: import("../../platform/ports").Ctx,
  user: { id: string; role: string },
  query: { status?: string; cursor?: number; limit?: number },
) {
  const base: {
    studentId?: string;
    universityId?: string;
    status?: ApplicationStatus;
    cursor?: number;
    limit?: number;
  } = {
    status: query.status as ApplicationStatus | undefined,
    cursor: query.cursor,
    limit: query.limit,
  };

  if (user.role === "admin" || user.role === "counselor") return base;

  if (user.role === "student") {
    const student = await findStudentByUserId(ctx, user.id);
    if (!student) return { ...base, studentId: "__none__" };
    return { ...base, studentId: student.id };
  }

  if (user.role === "university") {
    const uniId = await getUniversityIdForUser(ctx, user.id);
    if (!uniId) return { ...base, universityId: "__none__" };
    return { ...base, universityId: uniId };
  }

  return { ...base, studentId: "__none__" };
}
