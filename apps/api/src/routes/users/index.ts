import { Hono } from "hono";
import { z } from "zod";

import type { AppVariables } from "../../app";
import { requireAuth } from "../../middleware/auth";
import { validate } from "../../lib/validate";
import { ok, empty } from "../../lib/responses";
import { NotFoundError } from "../../lib/errors";
import { findUserById, updateUser, softDeleteUser, toPublicUser } from "../../services/users";
import { findStudentByUserId } from "../../services/students";
import { audit } from "../../services/audit";
import { revokeAllForUser } from "../../services/sessions";
import type { Ctx } from "../../platform/ports";
import { counselors, bankUsers, universityUsers } from "../../db/schema";
import { eq } from "drizzle-orm";

const updateMeSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().max(254).optional(),
  })
  .strict();

async function getProfileForUser(ctx: Ctx, userId: string, role: string) {
  if (role === "student") {
    return { type: "student" as const, profile: await findStudentByUserId(ctx, userId) };
  }
  if (role === "counselor") {
    const rows = await ctx.db
      .handle()
      .select()
      .from(counselors)
      .where(eq(counselors.userId, userId))
      .limit(1);
    return { type: "counselor" as const, profile: rows[0] ?? null };
  }
  if (role === "bank") {
    const rows = await ctx.db
      .handle()
      .select()
      .from(bankUsers)
      .where(eq(bankUsers.userId, userId))
      .limit(1);
    return { type: "bank" as const, profile: rows[0] ?? null };
  }
  if (role === "university") {
    const rows = await ctx.db
      .handle()
      .select()
      .from(universityUsers)
      .where(eq(universityUsers.userId, userId))
      .limit(1);
    return { type: "university" as const, profile: rows[0] ?? null };
  }
  return { type: "admin" as const, profile: null };
}

export function createUsersRouter(): Hono<{ Variables: AppVariables }> {
  const router = new Hono<{ Variables: AppVariables }>();

  router.get("/me", requireAuth(), async (c) => {
    const ctx = c.get("ctx");
    const { id, role } = c.get("user")!;
    const user = await findUserById(ctx, id);
    if (!user) throw new NotFoundError("user");

    const { type, profile } = await getProfileForUser(ctx, id, role);
    return ok(c, { user: toPublicUser(user), profileType: type, profile });
  });

  router.patch("/me", requireAuth(), validate(updateMeSchema, "body"), async (c) => {
    const ctx = c.get("ctx");
    const { id } = c.get("user")!;
    const input = c.get("validated_body") as z.infer<typeof updateMeSchema>;

    const updated = await updateUser(ctx, id, input);
    if (!updated) throw new NotFoundError("user");

    await audit(ctx, {
      actorUserId: id,
      action: "user.update",
      entityType: "user",
      entityId: id,
      metadata: { fields: Object.keys(input) },
    });

    return ok(c, { user: toPublicUser(updated) });
  });

  router.delete("/me", requireAuth(), async (c) => {
    const ctx = c.get("ctx");
    const { id } = c.get("user")!;

    await softDeleteUser(ctx, id);
    await revokeAllForUser(ctx, id);

    await audit(ctx, {
      actorUserId: id,
      action: "user.delete",
      entityType: "user",
      entityId: id,
    });

    return empty(c);
  });

  return router;
}
