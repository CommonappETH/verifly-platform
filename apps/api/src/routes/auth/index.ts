import { Hono } from "hono";
import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { z } from "zod";

import { userRoles } from "../../db/enums";
import { ConflictError, UnauthorizedError, ValidationError } from "../../lib/errors";
import {
  DUMMY_HASH,
  PASSWORD_MAX_LEN,
  PASSWORD_MIN_LEN,
  hashPassword,
  verifyPassword,
} from "../../lib/crypto/password";
import { requireAuth, SESSION_COOKIE } from "../../middleware/auth";
import { CSRF_COOKIE, generateCsrfToken } from "../../middleware/csrf";
import { rateLimit } from "../../middleware/rate-limit";
import type { AppVariables } from "../../app";
import {
  createPasswordReset,
  consumePasswordReset,
} from "../../services/password-resets";
import {
  createSession,
  revokeAllForUser,
  revokeSession,
  SESSION_TTL_SECONDS,
} from "../../services/sessions";
import {
  createUser,
  findUserByEmail,
  findUserById,
  toPublicUser,
  updatePasswordHash,
} from "../../services/users";

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const passwordSchema = z.string().min(PASSWORD_MIN_LEN).max(PASSWORD_MAX_LEN);

const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(userRoles),
    name: z.string().trim().min(1).max(100).nullable().optional(),
  })
  .strict();

const loginSchema = z.object({ email: emailSchema, password: passwordSchema }).strict();

const forgotSchema = z.object({ email: emailSchema }).strict();

const resetSchema = z
  .object({ token: z.string().min(10).max(256), new_password: passwordSchema })
  .strict();

const changeSchema = z
  .object({ current_password: passwordSchema, new_password: passwordSchema })
  .strict();

type AuthCtx = Context<{ Variables: AppVariables }>;

function setAuthCookies(c: AuthCtx, token: string): void {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: c.get("ctx").env === "prod",
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  const csrfToken = generateCsrfToken();
  setCookie(c, CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure: c.get("ctx").env === "prod",
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

function clearAuthCookies(c: AuthCtx): void {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  deleteCookie(c, CSRF_COOKIE, { path: "/" });
}

async function parseJson(c: { req: { json: () => Promise<unknown> } }): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new ValidationError("invalid JSON body");
  }
}

export function createAuthRouter(): Hono<{ Variables: AppVariables }> {
  const app = new Hono<{ Variables: AppVariables }>();

  const ipLimit = (name: string, windowMs: number, max: number) =>
    rateLimit({ name, windowMs, max, by: "ip" });

  app.post("/register", ipLimit("auth.register", 15 * 60 * 1000, 10), async (c) => {
    const body = await parseJson(c);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError("validation failed", { issues: parsed.error.issues });
    const ctx = c.get("ctx");
    const existing = await findUserByEmail(ctx, parsed.data.email);
    if (existing) throw new ConflictError("email already registered");
    const pepper = ctx.secrets.get("SESSION_PEPPER");
    const passwordHash = await hashPassword(parsed.data.password, pepper);
    const user = await createUser(ctx, {
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      name: parsed.data.name ?? null,
    });
    void ctx.email.send({
      to: user.email,
      template: "verify-email",
      data: { userId: user.id },
    });
    return c.json({ user: toPublicUser(user) }, 201);
  });

  app.post("/login", ipLimit("auth.login", 15 * 60 * 1000, 10), async (c) => {
    const body = await parseJson(c);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError("validation failed", { issues: parsed.error.issues });
    const ctx = c.get("ctx");
    const pepper = ctx.secrets.get("SESSION_PEPPER");
    const user = await findUserByEmail(ctx, parsed.data.email);
    const hash = user?.passwordHash ?? DUMMY_HASH;
    const ok = await verifyPassword(parsed.data.password, hash, pepper);
    if (!user || !ok) throw new UnauthorizedError("invalid email or password");
    const { token } = await createSession(ctx, {
      userId: user.id,
      ip: c.req.header("x-forwarded-for") ?? null,
      userAgent: c.req.header("user-agent") ?? null,
    });
    setAuthCookies(c, token);
    return c.json({ user: toPublicUser(user) });
  });

  app.post("/logout", async (c) => {
    const token = getCookie(c, SESSION_COOKIE);
    if (token) await revokeSession(c.get("ctx"), token);
    clearAuthCookies(c);
    return c.body(null, 204);
  });

  app.get("/me", requireAuth(), async (c) => {
    const ctx = c.get("ctx");
    const session = c.get("user") as { id: string };
    const user = await findUserById(ctx, session.id);
    if (!user) throw new UnauthorizedError();
    return c.json({ user: toPublicUser(user) });
  });

  app.post(
    "/password/forgot",
    ipLimit("auth.password_forgot", 15 * 60 * 1000, 10),
    async (c) => {
      const body = await parseJson(c);
      const parsed = forgotSchema.safeParse(body);
      if (!parsed.success) throw new ValidationError("validation failed", { issues: parsed.error.issues });
      const ctx = c.get("ctx");
      const user = await findUserByEmail(ctx, parsed.data.email);
      if (user) {
        const { token } = await createPasswordReset(ctx, user.id);
        void ctx.email.send({
          to: user.email,
          template: "password-reset",
          data: { token, userId: user.id },
        });
      }
      return c.body(null, 204);
    },
  );

  app.post("/password/reset", async (c) => {
    const body = await parseJson(c);
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError("validation failed", { issues: parsed.error.issues });
    const ctx = c.get("ctx");
    const consumed = await consumePasswordReset(ctx, parsed.data.token);
    if (!consumed) throw new UnauthorizedError("invalid or expired reset token");
    const pepper = ctx.secrets.get("SESSION_PEPPER");
    const passwordHash = await hashPassword(parsed.data.new_password, pepper);
    await updatePasswordHash(ctx, consumed.userId, passwordHash);
    await revokeAllForUser(ctx, consumed.userId);
    return c.body(null, 204);
  });

  app.post("/password/change", requireAuth(), async (c) => {
    const body = await parseJson(c);
    const parsed = changeSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError("validation failed", { issues: parsed.error.issues });
    const ctx = c.get("ctx");
    const current = c.get("user") as { id: string };
    const full = await findUserByEmail(ctx, (await findUserById(ctx, current.id))?.email ?? "");
    if (!full) throw new UnauthorizedError();
    const pepper = ctx.secrets.get("SESSION_PEPPER");
    const ok = await verifyPassword(parsed.data.current_password, full.passwordHash, pepper);
    if (!ok) throw new UnauthorizedError("current password incorrect");
    const newHash = await hashPassword(parsed.data.new_password, pepper);
    await updatePasswordHash(ctx, full.id, newHash);
    const currentToken = getCookie(c, SESSION_COOKIE);
    await revokeAllForUser(ctx, full.id);
    if (currentToken) {
      // Re-issue a session for the current device.
      const { token } = await createSession(ctx, {
        userId: full.id,
        ip: c.req.header("x-forwarded-for") ?? null,
        userAgent: c.req.header("user-agent") ?? null,
      });
      setAuthCookies(c, token);
    }
    return c.body(null, 204);
  });

  return app;
}
