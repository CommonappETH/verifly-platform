import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createDb } from "./client";

// A tmp file path is used instead of `:memory:` because SQLite silently
// downgrades `journal_mode` to `"memory"` for in-memory databases, which
// would make the WAL assertion impossible to satisfy.
const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function makeDbPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "verifly-pragmas-"));
  tempDirs.push(dir);
  return join(dir, "pragmas-test.sqlite");
}

describe("createDb pragmas", () => {
  it("sets journal_mode=WAL", () => {
    const db = createDb(makeDbPath());
    try {
      const row = db
        .query("PRAGMA journal_mode;")
        .get() as { journal_mode: string };
      expect(row.journal_mode).toBe("wal");
    } finally {
      db.close();
    }
  });

  it("sets foreign_keys=ON", () => {
    const db = createDb(makeDbPath());
    try {
      const row = db
        .query("PRAGMA foreign_keys;")
        .get() as { foreign_keys: number };
      expect(row.foreign_keys).toBe(1);
    } finally {
      db.close();
    }
  });

  it("sets synchronous=NORMAL", () => {
    const db = createDb(makeDbPath());
    try {
      const row = db
        .query("PRAGMA synchronous;")
        .get() as { synchronous: number };
      // SQLite synchronous levels: OFF=0, NORMAL=1, FULL=2, EXTRA=3.
      expect(row.synchronous).toBe(1);
    } finally {
      db.close();
    }
  });

  it("sets busy_timeout=5000", () => {
    const db = createDb(makeDbPath());
    try {
      const row = db
        .query("PRAGMA busy_timeout;")
        .get() as { timeout: number };
      expect(row.timeout).toBe(5000);
    } finally {
      db.close();
    }
  });
});
