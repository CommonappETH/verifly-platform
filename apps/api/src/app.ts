import { Hono } from "hono";

export type Ctx = { env: "dev" | "test" | "prod" };

export function createApp(_ctx: Ctx): Hono {
  const app = new Hono();

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "verifly-api",
      version: process.env.VERSION ?? "0.0.0",
    }),
  );

  return app;
}
