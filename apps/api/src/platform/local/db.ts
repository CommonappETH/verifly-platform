import type { Database } from "bun:sqlite";
import { createDb, resolveDatabasePath, toDrizzle } from "../../db/client";
import type { DbHandle, DbPort } from "../ports";

export interface LocalDb {
  port: DbPort;
  sqlite: Database;
}

export function createLocalDb(databaseUrl: string): LocalDb {
  const sqlite = createDb(resolveDatabasePath(databaseUrl));
  const drizzle: DbHandle = toDrizzle(sqlite);
  const port: DbPort = {
    handle: () => drizzle,
  };
  return { port, sqlite };
}
