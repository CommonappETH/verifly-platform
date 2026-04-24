import { getCookie } from "hono/cookie";
import type { MiddlewareHandler } from "hono";

import { ForbiddenError, UnauthorizedError } from "../lib/errors";
import type { UserRole } from "../db/enums";
import { findUserById } from "../services/users";
import { readSession } from "../services/sessions";

export const SESSION_COOKIE = "sid";

export const requireAuth = (): MiddlewareHandler => async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) throw new UnauthorizedError();
  const ctx = c.get("ctx");
  const session = await readSession(ctx, token);
  if (!session) throw new UnauthorizedError();
  const user = await findUserById(ctx, session.userId);
  if (!user) throw new UnauthorizedError();
  c.set("user", { id: user.id, role: user.role });
  await next();
};

export const requireRole =
  (...roles: UserRole[]): MiddlewareHandler =>
  async (c, next) => {
    const user = c.get("user") as { id: string; role: UserRole } | undefined;
    if (!user) throw new UnauthorizedError();
    if (!roles.includes(user.role)) throw new ForbiddenError();
    await next();
  };

export const requireSelfOrRole =
  (paramName: string, ...roles: UserRole[]): MiddlewareHandler =>
  async (c, next) => {
    const user = c.get("user") as { id: string; role: UserRole } | undefined;
    if (!user) throw new UnauthorizedError();
    const paramValue = c.req.param(paramName);
    if (paramValue === user.id) return next();
    if (!roles.includes(user.role)) throw new ForbiddenError();
    await next();
  };
