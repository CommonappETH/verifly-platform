import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { createDb, toDrizzle } from "../db/client";
import { users } from "../db/schema";
import type { Clock, Ctx, DbPort } from "../platform/ports";
import { createLocalSessionStore } from "../platform/local/sessions";
import { createSession, readSession, revokeAllForUser, revokeSession } from "./sessions";

function makeCtx(): { ctx: Ctx; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "verifly-sessions-"));
  const sqlite = createDb(join(dir, "t.sqlite"));
  const drizzle = toDrizzle(sqlite);
  migrate(drizzle, { migrationsFolder: join(import.meta.dir, "..", "..", "migrations") });

  let nowMs = 1_700_000_000_000;
  const clock: Clock = { now: () => nowMs };
  const dbPort: DbPort = { handle: () => drizzle };
  const store = createLocalSessionStore(dbPort, clock);

  // Seed a user so FK on sessions.user_id passes.
  drizzle
    .insert(users)
    .values({
      id: "u_1",
      email: "a@b.co",
      passwordHash: "x",
      role: "student",
      name: null,
      createdAt: nowMs,
      updatedAt: nowMs,
      deletedAt: null,
    })
    .run();

  const ctx: Ctx = {
    db: dbPort,
    sessions: store,
    storage: {} as never,
    email: {} as never,
    secrets: { get: () => "x" },
    clock,
    env: "test",
    requestId: "test",
  };

  return {
    ctx: Object.assign(ctx, {
      _advance(deltaMs: number) {
        nowMs += deltaMs;
      },
    }) as Ctx & { _advance: (ms: number) => void },
    cleanup: () => {
      sqlite.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

describe("sessions service", () => {
  let harness: ReturnType<typeof makeCtx>;
  beforeEach(() => {
    harness = makeCtx();
  });
  afterEach(() => harness.cleanup());

  test("create → read returns the record", async () => {
    const { token } = await createSession(harness.ctx, {
      userId: "u_1",
      ip: "127.0.0.1",
      userAgent: "ua",
    });
    const rec = await readSession(harness.ctx, token);
    expect(rec?.userId).toBe("u_1");
    expect(rec?.ip).toBe("127.0.0.1");
  });

  test("revoked session returns null", async () => {
    const { token } = await createSession(harness.ctx, {
      userId: "u_1",
      ip: null,
      userAgent: null,
    });
    await revokeSession(harness.ctx, token);
    expect(await readSession(harness.ctx, token)).toBeNull();
  });

  test("expired session returns null", async () => {
    const { token } = await createSession(harness.ctx, {
      userId: "u_1",
      ip: null,
      userAgent: null,
    });
    (harness.ctx as unknown as { _advance: (ms: number) => void })._advance(
      31 * 24 * 60 * 60 * 1000,
    );
    expect(await readSession(harness.ctx, token)).toBeNull();
  });

  test("revokeAllForUser invalidates every live session", async () => {
    const a = await createSession(harness.ctx, { userId: "u_1", ip: null, userAgent: null });
    const b = await createSession(harness.ctx, { userId: "u_1", ip: null, userAgent: null });
    await revokeAllForUser(harness.ctx, "u_1");
    expect(await readSession(harness.ctx, a.token)).toBeNull();
    expect(await readSession(harness.ctx, b.token)).toBeNull();
  });

  test("empty or unknown token returns null", async () => {
    expect(await readSession(harness.ctx, "")).toBeNull();
    expect(await readSession(harness.ctx, "nope")).toBeNull();
  });
});
