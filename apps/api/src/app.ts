import { Hono } from "hono";

import { errorHandler } from "./middleware/error-handler";
import { logger } from "./middleware/logger";
import { requestId } from "./middleware/request-id";
import { createContext } from "./platform";
import type { AppEnv, Ctx } from "./platform";

export interface AppBootstrap {
  env: AppEnv;
  version?: string;
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

export function createApp(boot: AppBootstrap): AppHono {
  const app = new Hono<{ Variables: AppVariables }>();

  app.onError(errorHandler(boot.env));
  app.use("*", requestId());
  app.use("*", logger());
  app.use("*", async (c, next) => {
    c.set("ctx", createContext({ requestId: c.get("requestId") }));
    await next();
  });

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "verifly-api",
      version: boot.version ?? "0.0.0",
    }),
  );

  return app;
}
