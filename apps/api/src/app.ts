import { Hono } from "hono";

import { csrf } from "./middleware/csrf";
import { errorHandler } from "./middleware/error-handler";
import { logger } from "./middleware/logger";
import { rateLimit } from "./middleware/rate-limit";
import { requestId } from "./middleware/request-id";
import { createContext } from "./platform";
import type { AppEnv, Ctx } from "./platform";
import { createAuthRouter } from "./routes/auth";
import { createUsersRouter } from "./routes/users";
import { createStudentsRouter } from "./routes/students";
import { createOrganizationsRouter } from "./routes/organizations";
import { createApplicationsRouter } from "./routes/applications";
import { createVerificationsRouter } from "./routes/verifications";
import { createDocumentsRouter } from "./routes/documents";
import { createAuditRouter } from "./routes/audit";
import { createStorageRouter } from "./routes/storage";

export interface AppBootstrap {
  env: AppEnv;
  version?: string;
  // Test-only override: build a Ctx per request (e.g. from a test harness).
  // Must still satisfy the Ctx port shape.
  createCtx?: (params: { requestId: string }) => Ctx;
}

export type AppVariables = {
  requestId: string;
  ctx: Ctx;
  user?: { id: string; role: string };
  validated_body?: unknown;
  validated_query?: unknown;
  validated_params?: unknown;
};

export type AppHono = Hono<{ Variables: AppVariables }>;

const PUBLIC_CSRF_EXEMPT: Array<[RegExp, Set<string>]> = [
  [/^\/auth\/login$/, new Set(["POST"])],
  [/^\/auth\/register$/, new Set(["POST"])],
  [/^\/auth\/password\/forgot$/, new Set(["POST"])],
  [/^\/auth\/password\/reset$/, new Set(["POST"])],
  [/^\/auth\/logout$/, new Set(["POST"])],
  [/^\/storage\//, new Set(["PUT", "GET"])],
];

function isPublicCsrf(path: string, method: string): boolean {
  return PUBLIC_CSRF_EXEMPT.some(([pat, methods]) => methods.has(method) && pat.test(path));
}

export function createApp(boot: AppBootstrap): AppHono {
  const app = new Hono<{ Variables: AppVariables }>();
  const makeCtx = boot.createCtx ?? createContext;

  app.onError(errorHandler(boot.env));
  app.use("*", requestId());
  app.use("*", logger());
  app.use("*", async (c, next) => {
    c.set("ctx", makeCtx({ requestId: c.get("requestId") }));
    await next();
  });
  app.use("*", csrf({ isPublic: isPublicCsrf }));

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "verifly-api",
      version: boot.version ?? "0.0.0",
    }),
  );

  app.route("/auth", createAuthRouter());
  app.route("/users", createUsersRouter());
  app.route("/students", createStudentsRouter());
  app.route("/organizations", createOrganizationsRouter());
  app.route("/applications", createApplicationsRouter());
  app.route("/verifications", createVerificationsRouter());
  app.route("/documents", createDocumentsRouter());
  app.route("/audit", createAuditRouter());
  app.route("/storage", createStorageRouter());

  return app;
}
