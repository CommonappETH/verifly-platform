import { Hono } from "hono";
import { z } from "zod";

import type { AppVariables } from "../../app";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validate } from "../../lib/validate";
import { paginated } from "../../lib/responses";
import { listAuditEntries } from "../../services/audit";

const listAuditQuerySchema = z.object({
  entityType: z.string().max(100).optional(),
  entityId: z.string().max(100).optional(),
  cursor: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export function createAuditRouter(): Hono<{ Variables: AppVariables }> {
  const router = new Hono<{ Variables: AppVariables }>();

  router.get(
    "/",
    requireAuth(),
    requireRole("admin"),
    validate(listAuditQuerySchema, "query"),
    async (c) => {
      const ctx = c.get("ctx");
      const query = c.get("validated_query") as z.infer<typeof listAuditQuerySchema>;

      const result = await listAuditEntries(ctx, {
        entityType: query.entityType,
        entityId: query.entityId,
        cursor: query.cursor,
        limit: query.limit,
      });

      return paginated(c, result.items, {
        cursor: result.nextCursor,
        hasMore: result.hasMore,
      });
    },
  );

  return router;
}
