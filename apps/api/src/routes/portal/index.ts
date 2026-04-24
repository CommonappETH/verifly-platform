import { Hono } from "hono";

import type { AppVariables } from "../../app";
import { requireAuth, requireRole } from "../../middleware/auth";
import { ok } from "../../lib/responses";
import { ForbiddenError, NotFoundError } from "../../lib/errors";
import { findStudentByUserId } from "../../services/students";
import {
  getAdminDashboard,
  getBankDashboard,
  getBankIdForUser,
  getCounselorDashboard,
  getStudentDashboard,
  getUniversityDashboard,
  getUniversityIdForDashboardUser,
} from "../../services/portal-dashboards";

export function createPortalRouter(): Hono<{ Variables: AppVariables }> {
  const router = new Hono<{ Variables: AppVariables }>();

  router.get(
    "/student/dashboard",
    requireAuth(),
    requireRole("student"),
    async (c) => {
      const ctx = c.get("ctx");
      const user = c.get("user")!;
      const student = await findStudentByUserId(ctx, user.id);
      if (!student) throw new NotFoundError("student profile");
      return ok(c, await getStudentDashboard(ctx, student.id, user.id));
    },
  );

  router.get(
    "/university/dashboard",
    requireAuth(),
    requireRole("university"),
    async (c) => {
      const ctx = c.get("ctx");
      const user = c.get("user")!;
      const universityId = await getUniversityIdForDashboardUser(ctx, user.id);
      if (!universityId) throw new ForbiddenError("user is not linked to a university");
      return ok(c, await getUniversityDashboard(ctx, universityId));
    },
  );

  router.get(
    "/bank/dashboard",
    requireAuth(),
    requireRole("bank"),
    async (c) => {
      const ctx = c.get("ctx");
      const user = c.get("user")!;
      const bankId = await getBankIdForUser(ctx, user.id);
      if (!bankId) throw new ForbiddenError("user is not linked to a bank");
      return ok(c, await getBankDashboard(ctx, bankId));
    },
  );

  router.get(
    "/counselor/dashboard",
    requireAuth(),
    requireRole("counselor"),
    async (c) => {
      const ctx = c.get("ctx");
      const user = c.get("user")!;
      return ok(c, await getCounselorDashboard(ctx, user.id));
    },
  );

  router.get(
    "/admin/dashboard",
    requireAuth(),
    requireRole("admin"),
    async (c) => {
      const ctx = c.get("ctx");
      return ok(c, await getAdminDashboard(ctx));
    },
  );

  return router;
}
