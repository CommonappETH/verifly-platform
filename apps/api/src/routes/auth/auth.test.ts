import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { createApp } from "../../app";
import { createTestHarness, type TestHarness } from "../../testing/harness";

interface Session {
  sid?: string;
  csrf?: string;
}

function parseSetCookies(res: Response): Record<string, { value: string; attrs: string }> {
  const out: Record<string, { value: string; attrs: string }> = {};
  const headers: string[] = [];
  // In Bun/Hono, multiple Set-Cookie headers come back through getSetCookie if available,
  // otherwise via the combined header.
  const anyRes = res as unknown as { headers: Headers & { getSetCookie?: () => string[] } };
  const maybe = anyRes.headers.getSetCookie?.();
  if (maybe && maybe.length) {
    headers.push(...maybe);
  } else {
    const combined = res.headers.get("set-cookie");
    if (combined) headers.push(...combined.split(/,(?=[^ ]+=)/));
  }
  for (const line of headers) {
    const [pair, ...attrs] = line.split(";");
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    out[name] = { value, attrs: attrs.join(";") };
  }
  return out;
}

function cookieHeader(session: Session): string {
  return Object.entries(session)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k === "sid" ? "sid" : "csrf"}=${v}`)
    .join("; ");
}

function jsonRequest(
  path: string,
  method: string,
  body: unknown,
  session?: Session,
): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (session) {
    const cookie = cookieHeader(session);
    if (cookie) headers.cookie = cookie;
    if (session.csrf) headers["x-csrf-token"] = session.csrf;
  }
  return new Request(`http://local${path}`, {
    method,
    headers,
    body: JSON.stringify(body),
  });
}

describe("auth flow", () => {
  let h: TestHarness;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    h = createTestHarness();
    app = createApp({
      env: "test",
      createCtx: ({ requestId }) => ({ ...h.ctx, requestId }),
    });
  });
  afterEach(() => h.cleanup());

  test("register → login → me → logout → me returns 401", async () => {
    // register
    const reg = await app.request(
      jsonRequest("/auth/register", "POST", {
        email: "alice@example.com",
        password: "correct-horse-battery",
        role: "student",
        name: "Alice",
      }),
    );
    expect(reg.status).toBe(201);
    const regBody = (await reg.json()) as { user: { email: string; role: string } };
    expect(regBody.user.email).toBe("alice@example.com");
    expect(regBody.user.role).toBe("student");

    // login
    const login = await app.request(
      jsonRequest("/auth/login", "POST", {
        email: "alice@example.com",
        password: "correct-horse-battery",
      }),
    );
    expect(login.status).toBe(200);
    const cookies = parseSetCookies(login);
    expect(cookies.sid?.value).toBeString();
    expect(cookies.csrf?.value).toBeString();
    const session: Session = { sid: cookies.sid!.value, csrf: cookies.csrf!.value };

    // me
    const me = await app.request(
      new Request("http://local/auth/me", { headers: { cookie: cookieHeader(session) } }),
    );
    expect(me.status).toBe(200);
    const meBody = (await me.json()) as { user: { email: string } };
    expect(meBody.user.email).toBe("alice@example.com");

    // logout (CSRF exempt)
    const logout = await app.request(
      new Request("http://local/auth/logout", {
        method: "POST",
        headers: { cookie: cookieHeader(session) },
      }),
    );
    expect(logout.status).toBe(204);

    // me again — expired/revoked cookie means 401 (cookies are cleared but
    // we keep sending the old one to prove revocation took effect)
    const meAfter = await app.request(
      new Request("http://local/auth/me", { headers: { cookie: cookieHeader(session) } }),
    );
    expect(meAfter.status).toBe(401);
  });

  test("duplicate registration → 409", async () => {
    await app.request(
      jsonRequest("/auth/register", "POST", {
        email: "dup@example.com",
        password: "correct-horse-battery",
        role: "student",
      }),
    );
    const again = await app.request(
      jsonRequest("/auth/register", "POST", {
        email: "dup@example.com",
        password: "correct-horse-battery",
        role: "student",
      }),
    );
    expect(again.status).toBe(409);
  });

  test("login with wrong password → 401 (generic)", async () => {
    await app.request(
      jsonRequest("/auth/register", "POST", {
        email: "bob@example.com",
        password: "correct-horse-battery",
        role: "student",
      }),
    );
    const login = await app.request(
      jsonRequest("/auth/login", "POST", {
        email: "bob@example.com",
        password: "wrong-password-xxx-1",
      }),
    );
    expect(login.status).toBe(401);
  });

  test("CSRF blocks authenticated mutating request without header", async () => {
    await app.request(
      jsonRequest("/auth/register", "POST", {
        email: "csrf@example.com",
        password: "correct-horse-battery",
        role: "student",
      }),
    );
    const login = await app.request(
      jsonRequest("/auth/login", "POST", {
        email: "csrf@example.com",
        password: "correct-horse-battery",
      }),
    );
    const cookies = parseSetCookies(login);
    const session: Session = { sid: cookies.sid!.value, csrf: cookies.csrf!.value };

    // Send password/change with cookies but without X-CSRF-Token header.
    const res = await app.request(
      new Request("http://local/auth/password/change", {
        method: "POST",
        headers: { cookie: cookieHeader(session), "content-type": "application/json" },
        body: JSON.stringify({
          current_password: "correct-horse-battery",
          new_password: "new-correct-horse-battery",
        }),
      }),
    );
    expect(res.status).toBe(403);
  });

  test("password forgot always 204, even for unknown email", async () => {
    const a = await app.request(
      jsonRequest("/auth/password/forgot", "POST", { email: "ghost@example.com" }),
    );
    expect(a.status).toBe(204);
  });

  test("rate limiter trips login after the threshold", async () => {
    // Each login runs argon2id against DUMMY_HASH (~1.5s in the local
    // adapter's default parameters); 11 sequential attempts easily exceeds
    // the default 5s per-test timeout.
    for (let i = 0; i < 10; i++) {
      const res = await app.request(
        jsonRequest("/auth/login", "POST", {
          email: "nobody@example.com",
          password: "wrong-password-xxx-1",
        }),
      );
      expect(res.status).toBe(401);
    }
    const tripped = await app.request(
      jsonRequest("/auth/login", "POST", {
        email: "nobody@example.com",
        password: "wrong-password-xxx-1",
      }),
    );
    expect(tripped.status).toBe(429);
  }, 30_000);
});
