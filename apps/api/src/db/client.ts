import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { schema } from "./schema";

const FILE_URL_PREFIX = "file:";

export function createDb(path: string): Database {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }

  const sqlite = new Database(path);
  sqlite.run("PRAGMA journal_mode = WAL;");
  sqlite.run("PRAGMA foreign_keys = ON;");
  sqlite.run("PRAGMA synchronous = NORMAL;");
  sqlite.run("PRAGMA busy_timeout = 5000;");
  return sqlite;
}

export function toDrizzle(sqlite: Database) {
  return drizzle(sqlite, { schema });
}

export function resolveDatabasePath(databaseUrl: string): string {
  if (databaseUrl === ":memory:") return ":memory:";
  if (databaseUrl.startsWith(FILE_URL_PREFIX)) {
    return databaseUrl.slice(FILE_URL_PREFIX.length);
  }
  return databaseUrl;
}
