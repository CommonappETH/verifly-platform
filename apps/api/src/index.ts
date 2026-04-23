import { Hono } from "hono";

type Bindings = {
  APP_ENV: string;
  VERSION: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "verifly-api",
    version: c.env.VERSION ?? "dev",
  }),
);

export default { fetch: app.fetch };
