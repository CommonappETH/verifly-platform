import { Hono } from "hono";
import { z } from "zod";

import type { AppVariables } from "../../app";
import { requireAuth, requireRole, requireSelfOrRole } from "../../middleware/auth";
import { validate } from "../../lib/validate";
import { ok, created, paginated, empty } from "../../lib/responses";
import { ConflictError, ForbiddenError, NotFoundError } from "../../lib/errors";
import {
  createStudent,
  findStudentById,
  findStudentByUserId,
  updateStudent,
  listStudents,
} from "../../services/students";
import {
  createGuardian,
  findGuardianById,
  listGuardiansByStudent,
  updateGuardian,
  deleteGuardian,
} from "../../services/guardians";
import { audit } from "../../services/audit";

const createStudentSchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    fullName: z.string().min(1).max(200).optional(),
    country: z.string().max(100).optional(),
    nationality: z.string().max(100).optional(),
    gpa: z.number().min(0).max(5).optional(),
    university: z.string().max(200).optional(),
    intendedStudy: z.string().max(200).optional(),
  })
  .strict();

const updateStudentSchema = createStudentSchema;

const listStudentsQuerySchema = z.object({
  cursor: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  q: z.string().max(200).optional(),
});

const createGuardianSchema = z
  .object({
    fullName: z.string().min(1).max(200),
    relationship: z.string().max(100).optional(),
    email: z.string().email().max(254).optional(),
    phone: z.string().max(30).optional(),
  })
  .strict();

const updateGuardianSchema = z
  .object({
    fullName: z.string().min(1).max(200).optional(),
    relationship: z.string().max(100).optional(),
    email: z.string().email().max(254).optional(),
    phone: z.string().max(30).optional(),
  })
  .strict();

async function assertStudentAccess(
  c: { get: (k: string) => unknown },
  studentId: string,
  ctx: import("../../platform/ports").Ctx,
): Promise<void> {
  const user = c.get("user") as { id: string; role: string };
  if (user.role === "admin") return;

  const student = await findStudentById(ctx, studentId);
  if (!student) throw new NotFoundError("student");

  if (user.role === "student" && student.userId === user.id) return;
  if (user.role === "counselor") return;
  if (user.role === "university") return;

  throw new ForbiddenError();
}

export function createStudentsRouter(): Hono<{ Variables: AppVariables }> {
  const router = new Hono<{ Variables: AppVariables }>();

  router.post("/", requireAuth(), requireRole("student"), validate(createStudentSchema, "body"), async (c) => {
    const ctx = c.get("ctx");
    const { id: userId } = c.get("user")!;
    const input = c.get("validated_body") as z.infer<typeof createStudentSchema>;

    const existing = await findStudentByUserId(ctx, userId);
    if (existing) throw new ConflictError("student profile already exists");

    const student = await createStudent(ctx, { ...input, userId });

    await audit(ctx, {
      actorUserId: userId,
      action: "student.create",
      entityType: "student",
      entityId: student.id,
    });

    return created(c, student);
  });

  router.get("/:id", requireAuth(), async (c) => {
    const ctx = c.get("ctx");
    const studentId = c.req.param("id");
    await assertStudentAccess(c, studentId, ctx);

    const student = await findStudentById(ctx, studentId);
    if (!student) throw new NotFoundError("student");

    return ok(c, student);
  });

  router.patch("/:id", requireAuth(), validate(updateStudentSchema, "body"), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const studentId = c.req.param("id");
    const input = c.get("validated_body") as z.infer<typeof updateStudentSchema>;

    const student = await findStudentById(ctx, studentId);
    if (!student) throw new NotFoundError("student");
    if (user.role !== "admin" && student.userId !== user.id) throw new ForbiddenError();

    const updated = await updateStudent(ctx, studentId, input);

    await audit(ctx, {
      actorUserId: user.id,
      action: "student.update",
      entityType: "student",
      entityId: studentId,
      metadata: { fields: Object.keys(input) },
    });

    return ok(c, updated);
  });

  router.get("/", requireAuth(), requireRole("admin"), validate(listStudentsQuerySchema, "query"), async (c) => {
    const ctx = c.get("ctx");
    const query = c.get("validated_query") as z.infer<typeof listStudentsQuerySchema>;

    const result = await listStudents(ctx, query);
    return paginated(c, result.items, {
      cursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  });

  // --- Guardian sub-routes ---

  router.get("/:id/guardians", requireAuth(), async (c) => {
    const ctx = c.get("ctx");
    const studentId = c.req.param("id");
    await assertStudentAccess(c, studentId, ctx);

    const items = await listGuardiansByStudent(ctx, studentId);
    return ok(c, items);
  });

  router.post("/:id/guardians", requireAuth(), validate(createGuardianSchema, "body"), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const studentId = c.req.param("id");

    const student = await findStudentById(ctx, studentId);
    if (!student) throw new NotFoundError("student");
    if (user.role !== "admin" && student.userId !== user.id) throw new ForbiddenError();

    const input = c.get("validated_body") as z.infer<typeof createGuardianSchema>;
    const guardian = await createGuardian(ctx, { ...input, studentId });

    await audit(ctx, {
      actorUserId: user.id,
      action: "guardian.create",
      entityType: "guardian",
      entityId: guardian.id,
      metadata: { studentId },
    });

    return created(c, guardian);
  });

  router.patch("/:id/guardians/:guardianId", requireAuth(), validate(updateGuardianSchema, "body"), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const studentId = c.req.param("id");
    const guardianId = c.req.param("guardianId");

    const student = await findStudentById(ctx, studentId);
    if (!student) throw new NotFoundError("student");
    if (user.role !== "admin" && student.userId !== user.id) throw new ForbiddenError();

    const guardian = await findGuardianById(ctx, guardianId);
    if (!guardian || guardian.studentId !== studentId) throw new NotFoundError("guardian");

    const input = c.get("validated_body") as z.infer<typeof updateGuardianSchema>;
    const updated = await updateGuardian(ctx, guardianId, input);

    await audit(ctx, {
      actorUserId: user.id,
      action: "guardian.update",
      entityType: "guardian",
      entityId: guardianId,
      metadata: { studentId },
    });

    return ok(c, updated);
  });

  router.delete("/:id/guardians/:guardianId", requireAuth(), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const studentId = c.req.param("id");
    const guardianId = c.req.param("guardianId");

    const student = await findStudentById(ctx, studentId);
    if (!student) throw new NotFoundError("student");
    if (user.role !== "admin" && student.userId !== user.id) throw new ForbiddenError();

    const guardian = await findGuardianById(ctx, guardianId);
    if (!guardian || guardian.studentId !== studentId) throw new NotFoundError("guardian");

    await deleteGuardian(ctx, guardianId);

    await audit(ctx, {
      actorUserId: user.id,
      action: "guardian.delete",
      entityType: "guardian",
      entityId: guardianId,
      metadata: { studentId },
    });

    return empty(c);
  });

  return router;
}
