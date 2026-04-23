import type { MiddlewareHandler } from "hono";

export const logger = (): MiddlewareHandler => async (c, next) => {
  const start = performance.now();
  await next();
  const duration_ms = Math.round(performance.now() - start);
  const user = c.get("user") as { id: string } | undefined;
  const line = {
    level: "info",
    ts: new Date().toISOString(),
    request_id: c.get("requestId"),
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration_ms,
    user_id: user?.id,
  };
  console.log(JSON.stringify(line));
};
