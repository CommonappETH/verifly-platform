import { defineConfig } from "drizzle-kit";

// `driver` is intentionally unset: migrations are applied by our own runner
// in `src/db/migrate.ts`, not by drizzle-kit. This config exists solely to
// let `bunx drizzle-kit generate` diff the TS schema against the last
// migration and emit the next `migrations/NNNN_*.sql` file.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema",
  out: "./migrations",
});
