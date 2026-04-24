import { Hono } from "hono";
import { z } from "zod";

import type { AppVariables } from "../../app";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../lib/validate";
import { ok, created, paginated } from "../../lib/responses";
import { ConflictError, NotFoundError } from "../../lib/errors";
import { organizationKinds } from "../../db/enums";
import {
  createOrganization,
  findOrganizationById,
  findOrganizationBySlug,
  updateOrganization,
  listOrganizations,
} from "../../services/organizations";
import { audit } from "../../services/audit";

const createOrganizationSchema = z
  .object({
    kind: z.enum(organizationKinds),
    name: z.string().min(1).max(200),
    slug: z.string().min(1).max(100),
    country: z.string().max(100).optional(),
  })
  .strict();

const updateOrganizationSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    slug: z.string().min(1).max(100).optional(),
    country: z.string().max(100).optional(),
  })
  .strict();

const listOrganizationsQuerySchema = z.object({
  kind: z.enum(organizationKinds).optional(),
  cursor: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  q: z.string().max(200).optional(),
});

export function createOrganizationsRouter(): Hono<{ Variables: AppVariables }> {
  const router = new Hono<{ Variables: AppVariables }>();

  router.get("/", requireAuth(), validate(listOrganizationsQuerySchema, "query"), async (c) => {
    const ctx = c.get("ctx");
    const query = c.get("validated_query") as z.infer<typeof listOrganizationsQuerySchema>;

    const result = await listOrganizations(ctx, query);
    return paginated(c, result.items, {
      cursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  });

  router.get("/:id", requireAuth(), async (c) => {
    const ctx = c.get("ctx");
    const id = c.req.param("id");
    const org = await findOrganizationById(ctx, id);
    if (!org) throw new NotFoundError("organization");
    return ok(c, org);
  });

  router.post("/", requireAuth(), requireRole("admin"), validate(createOrganizationSchema, "body"), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const input = c.get("validated_body") as z.infer<typeof createOrganizationSchema>;

    const existing = await findOrganizationBySlug(ctx, input.slug);
    if (existing) throw new ConflictError("organization with this slug already exists");

    const org = await createOrganization(ctx, input);

    await audit(ctx, {
      actorUserId: user.id,
      action: "organization.create",
      entityType: "organization",
      entityId: org.id,
      metadata: { kind: input.kind, slug: input.slug },
    });

    return created(c, org);
  });

  router.patch("/:id", requireAuth(), requireRole("admin"), validate(updateOrganizationSchema, "body"), async (c) => {
    const ctx = c.get("ctx");
    const user = c.get("user")!;
    const id = c.req.param("id");
    const input = c.get("validated_body") as z.infer<typeof updateOrganizationSchema>;

    const existing = await findOrganizationById(ctx, id);
    if (!existing) throw new NotFoundError("organization");

    if (input.slug) {
      const slugConflict = await findOrganizationBySlug(ctx, input.slug);
      if (slugConflict && slugConflict.id !== id) {
        throw new ConflictError("organization with this slug already exists");
      }
    }

    const updated = await updateOrganization(ctx, id, input);

    await audit(ctx, {
      actorUserId: user.id,
      action: "organization.update",
      entityType: "organization",
      entityId: id,
      metadata: { fields: Object.keys(input) },
    });

    return ok(c, updated);
  });

  return router;
}
