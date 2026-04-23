import type { MiddlewareHandler } from "hono";
import { nanoid } from "nanoid";

export const requestId = (): MiddlewareHandler => async (c, next) => {
  const incoming = c.req.header("X-Request-ID");
  const id = incoming && incoming.length <= 128 ? incoming : nanoid();
  c.set("requestId", id);
  c.header("X-Request-ID", id);
  await next();
};
