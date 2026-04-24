import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { createDb, toDrizzle } from "../db/client";
import { createLocalEmail } from "../platform/local/email";
import { createLocalSessionStore } from "../platform/local/sessions";
import { createLocalStorage } from "../platform/local/storage";
import type { Clock, Ctx } from "../platform/ports";

export interface TestHarness {
  ctx: Ctx;
  setNow(ms: number): void;
  advance(ms: number): void;
  cleanup(): void;
  dir: string;
}

export function createTestHarness(options: { pepper?: string } = {}): TestHarness {
  const dir = mkdtempSync(join(tmpdir(), "verifly-test-"));
  const sqlite = createDb(join(dir, "t.sqlite"));
  const drizzle = toDrizzle(sqlite);
  migrate(drizzle, { migrationsFolder: join(import.meta.dir, "..", "..", "migrations") });

  let nowMs = 1_700_000_000_000;
  const clock: Clock = { now: () => nowMs };
  const dbPort = { handle: () => drizzle };
  const sessions = createLocalSessionStore(dbPort, clock);
  const storage = createLocalStorage(
    {
      rootDir: join(dir, "storage"),
      pepper: options.pepper ?? "test-pepper-1234567890-abcd",
      publicBaseUrl: "http://localhost:8787",
    },
    clock,
  );
  const email = createLocalEmail({ outboxDir: join(dir, "outbox"), env: "test" });
  const pepper = options.pepper ?? "test-pepper-1234567890-abcd";

  const ctx: Ctx = {
    db: dbPort,
    sessions,
    storage,
    email,
    secrets: {
      get(name) {
        if (name === "SESSION_PEPPER") return pepper;
        return "x";
      },
    },
    clock,
    env: "test",
    requestId: "test",
  };

  return {
    ctx,
    setNow: (ms) => {
      nowMs = ms;
    },
    advance: (ms) => {
      nowMs += ms;
    },
    cleanup: () => {
      sqlite.close();
      rmSync(dir, { recursive: true, force: true });
    },
    dir,
  };
}
