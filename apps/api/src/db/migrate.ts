// CLI entrypoint for `bun run db:migrate`. Opens the dev SQLite DB and
// applies every pending file under `./migrations/`. Exits non-zero on
// failure so CI / shell scripts can stop the build.

import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { createDb, resolveDatabasePath, toDrizzle } from "./client";

const databaseUrl =
  process.env.DATABASE_URL ?? "file:./.data/verifly-dev.sqlite";
const path = resolveDatabasePath(databaseUrl);

try {
  const sqlite = createDb(path);
  const db = toDrizzle(sqlite);
  migrate(db, { migrationsFolder: "./migrations" });
  sqlite.close();
  console.log(`migrations applied to ${path}`);
} catch (err) {
  console.error("migration failed:", err);
  process.exit(1);
}
