# Verifly Backend — Execution Checklist (v2, local-first)

Sequential, atomic build plan for the Verifly backend. **Local-first**: everything runs on your laptop until Phase 15, when we prepare for AWS deployment. No Cloudflare, no cloud accounts, no network dependency to ship features.

**Stack:** Bun (runtime) + Hono (router) + SQLite via `bun:sqlite` (database) + local filesystem (object storage) + SQLite-backed session store + Drizzle ORM + Zod (validation). Self-built email/password auth with HttpOnly cookie sessions. **Target deploy:** AWS (Lambda or Fargate + RDS Postgres + S3 + ElastiCache/DynamoDB + SES), prepared in Phase 15, executed out of scope of this checklist.

**Deliverable:** A single `apps/api` Bun service that serves all 5 portals (`admin`, `bank`, `counselor`, `student`, `university`) against one shared database, role-scoped. Runs on `http://localhost:8787`.

**Portability contract:** Route handlers and services only touch `ctx.db` / `ctx.sessions` / `ctx.storage` / `ctx.email` / `ctx.secrets`. Local adapters implement those ports today; AWS adapters implement the same ports in Phase 15 — swap ~5 files, not every route.

**Hard rules (from AIRULES.md):**
- Tick each box inline as you complete the task (update this file with the code, not after).
- Update `learningguide.md` after every phase with what/why/how.
- Follow `namingconventions.md` strictly.
- Never skip verification steps.
- **Schemas stay in the SQLite ∩ Postgres intersection.** No JSON columns, no `AUTOINCREMENT`, no case-insensitive `LIKE` assumptions, no SQLite-only defaults. Use `text` for UUIDs, integer millis for timestamps, explicit `CHECK` constraints instead of type magic. Rationale: zero rewrite when swapping to Postgres on AWS.

Entities (canonical shapes already in `@verifly/types`): `User`, `Student`, `Guardian`, `Counselor`, `BankUser`, `Application`, `Verification`, `Document`.

---

## Context: carryover from v1 (Cloudflare)

The original v1 checklist (Cloudflare Workers) completed Phase 0 and Phase 1 on `main` (commit `629879c`, merged in `6265a19`). That work is mostly reusable; the Cloudflare-specific files are removed/rewritten in Phase 0 of this v2 plan. Nothing was ever provisioned in the cloud (no `wrangler login` ever ran), so there is zero cleanup beyond local files.

**Reused from v1:** branch workflow, baseline-build ritual, `@verifly/types` canonical entities, overall phase structure, the `Ctx`/ports/adapters design (Phase 4.1 v1 → Phase 4.1 v2).

**Discarded from v1:** Cloudflare account topology decision, `*.workers.dev` / custom-domain URL scheme, Wrangler as a tool, all D1/R2/KV bindings, `@cloudflare/*` packages.

`learningguide.md` §11 and §12 remain as a historical record of the v1 decisions. A new §13 will explain the v2 pivot in Phase 0.

---

## Phase 0 — Pre-flight & reset

- [x] Create a work branch from `main`: `git checkout -b backend/phase-0-v2-reset`.
- [x] Record baseline: `bun install` at root succeeds; all 5 apps still build (`cd apps/<x> && bun run build` each).
- [x] Delete `apps/api/wrangler.jsonc` — Cloudflare-only, no replacement needed.
- [x] Rewrite `apps/api/package.json`:
  - Name: `@verifly/api`.
  - Scripts: `dev` (`bun run --watch src/server.ts`), `start` (`bun run src/server.ts`), `build` (`bun build src/server.ts --outdir=dist --target=bun`), `typecheck`, `lint`, `test`.
  - Runtime deps: `hono`, `drizzle-orm`, `zod`, `@noble/hashes` (argon2id), `nanoid`.
  - Dev deps: `@types/bun`, `@verifly/config`, `drizzle-kit`, `typescript`, `vitest`.
  - Remove: `wrangler`, `@cloudflare/workers-types`, `@cloudflare/vitest-pool-workers`, `better-sqlite3` (not needed — `bun:sqlite` is built in).
- [x] Rewrite `apps/api/tsconfig.json` extending `@verifly/config/tsconfig.base.json`, with `types: ["@types/bun"]`, `lib: ["ES2022"]` (no DOM), `paths: { "@/*": ["./src/*"] }`.
- [x] Document the stack pivot in `learningguide.md` §13 (why local-first, SQLite ∩ Postgres discipline, AWS path preserved via ports).
- [x] Decide and document the local base URL: `http://localhost:8787` (dev). AWS URLs deferred to Phase 15.
- [x] Decide and document (in §13) the chosen AWS compute target for Phase 15: **default Lambda + API Gateway via `hono/aws-lambda`**, with Fargate as the fallback if a route ever exceeds Lambda's 15-minute limit or 6 MB payload cap.
- [x] Decide and document the DB parity strategy: SQLite via `bun:sqlite` primary; add a parallel "Postgres via Docker" track in Phase 14 for pre-migration testing.
- [x] Verify: root `bun install` is clean after the rewrites; no `wrangler` / `@cloudflare/*` appears in `bun.lock` anymore (`grep -E "wrangler|@cloudflare" bun.lock | head`). — **Partial:** `apps/api` direct deps are clean; `bun.lock` still carries `@cloudflare/vite-plugin` + transitive `wrangler` pulled by the 5 frontends' deploy stack. Backend-scope check satisfied; frontend retargeting tracked as Phase 15.4.
- [ ] Commit: `refactor(api): reset scaffold from Cloudflare to local Bun + Hono`.

## Phase 1 — Rescaffold `apps/api` (Bun + Hono)

- [x] Ensure directory exists: `apps/api/src/`.
- [x] Create `apps/api/src/app.ts` — the Hono app factory. Exports `createApp(ctx: Ctx): Hono`. Phase 4.1 fills in `Ctx`; for now it accepts a minimal shape `{ env: "dev" }`.
- [x] Create `apps/api/src/server.ts` — reads `PORT` (default 8787) and calls `Bun.serve({ fetch: createApp({ env: "dev" }).fetch, port })`. Logs `listening on :PORT`.
- [x] Move the existing `/health` route from v1 `src/index.ts` into `app.ts`: `app.get("/health", (c) => c.json({ ok: true, service: "verifly-api", version: process.env.VERSION ?? "0.0.0" }))`.
- [x] Delete `apps/api/src/index.ts` (superseded by `app.ts` + `server.ts`).
- [x] Create `apps/api/.env.example` documenting: `PORT`, `APP_ENV`, `DATABASE_URL` (filled Phase 2), `SESSION_PEPPER` (Phase 5), `COOKIE_DOMAIN`, `ALLOWED_ORIGINS` (Phase 11), `STORAGE_DIR` (Phase 8).
- [x] Add `apps/api/.gitignore` covering `.env`, `.data/`, `.storage/`, `dist/`.
- [x] Verify: `cd apps/api && bun run dev` starts the server; `curl http://localhost:8787/health` → `{"ok":true,"service":"verifly-api","version":"0.0.0"}`.
- [x] Verify: `cd apps/api && bun run typecheck` passes.
- [ ] Commit: `feat(api): Bun + Hono server with /health endpoint`.

## Phase 2 — SQLite database provisioning

- [x] Create `apps/api/.data/` (gitignored); dev DB file lives at `apps/api/.data/verifly-dev.sqlite`. (`.data/` is covered by `apps/api/.gitignore`; `createDb` `mkdir`s the parent on first open.)
- [x] Create `apps/api/src/db/client.ts`:
  - `import { Database } from "bun:sqlite"`.
  - `export function createDb(path: string)` — opens the file, sets pragmas: `journal_mode=WAL`, `foreign_keys=ON`, `synchronous=NORMAL`, `busy_timeout=5000`.
  - `export function toDrizzle(sqlite: Database)` — returns `drizzle(sqlite, { schema })` from `drizzle-orm/bun-sqlite`. (A placeholder `src/db/schema/index.ts` barrel was added so the signature matches now; Phase 3 fills it in.)
- [x] Add `DATABASE_URL` handling: default `file:./.data/verifly-dev.sqlite`. Tests override to `:memory:`. (Provided via `resolveDatabasePath(url)` in `client.ts`; `:memory:` and `file:` prefixes both supported. Not yet wired from `secrets.ts` — that arrives in Phase 4.1.)
- [x] Create `apps/api/src/db/pragmas.test.ts` — spin up an in-memory DB, assert each pragma is set. (Deviation: the test uses a tmp-file DB, not `:memory:`, because SQLite downgrades `journal_mode` to `"memory"` for in-memory DBs, which would make the WAL assertion unsatisfiable. Documented in `learningguide.md` §15.)
- [x] Add package scripts: `db:migrate` (Phase 3), `db:reset` (delete `.data/*.sqlite`), `db:seed` (Phase 14). (`db:migrate` and `db:seed` are echo stubs until their real phases; `db:reset` also clears `-shm`/`-wal` sidecars. Test script switched from `vitest` to `bun test` because vitest can't resolve `bun:sqlite` — it runs under Node.)
- [x] Verify: `bun run dev` still boots and `/health` still returns OK after wiring the DB client (not yet invoked by any route).
- [ ] Commit: `feat(api): SQLite client with WAL + FK pragmas`.

## Phase 3 — Drizzle schema & migrations

**Portability rules for every table in this phase:**
- Primary keys: `id text primary key` (nanoid generated in the service layer).
- Timestamps: `createdAt integer not null` (Unix millis), never SQLite's `CURRENT_TIMESTAMP` default — set in code.
- Booleans: `integer not null` (0/1) with an explicit `CHECK(column IN (0,1))`.
- Enums: `text not null` + explicit `CHECK(column IN ('a','b',...))`. No sqlite-only type coercion.
- Foreign keys: always declared, with `ON DELETE` action explicit (`cascade` or `restrict`).
- No `JSON` columns in v1 of the schema. If structured blobs are needed, use `text` + Zod parsing at the service boundary. (Postgres will later add `jsonb`; re-evaluate in Phase 15.)

- [x] Create `apps/api/src/db/schema/` with one file per entity.
- [x] `schema/users.ts` — `users`: `id` PK, `email` text unique not null, `password_hash` text not null, `role` text not null (CHECK list of `UserRole`), `name` text, `created_at`, `updated_at`, `deleted_at` (nullable). Index on `email`.
- [x] `schema/students.ts` — `students`: `id` PK, `user_id` FK→users, `first_name`, `last_name`, `full_name`, `country`, `nationality`, `gpa` (real), `university` (text), `intended_study` (text), timestamps, soft delete. Index on `user_id`.
- [x] `schema/guardians.ts` — `guardians`: `id`, `student_id` FK→students, `full_name`, `relationship`, `email`, `phone`, timestamps.
- [x] `schema/counselors.ts` — `counselors`: `id`, `user_id` FK→users, `school_name`, timestamps.
- [x] `schema/bank_users.ts` — `bank_users`: `id`, `user_id` FK→users, `bank_id` FK→organizations (nullable until 3.5), timestamps.
- [x] `schema/organizations.ts` — `organizations`: `id`, `kind` text CHECK (`university`|`bank`), `name`, `slug` unique, `country`, timestamps. Index on `(kind, slug)`.
- [x] `schema/university_users.ts` — `university_users`: `id`, `user_id` FK→users, `university_id` FK→organizations, `title`, timestamps.
- [x] `schema/applications.ts` — `applications`: `id`, `student_id` FK, `university_id` FK, `program`, `status` text CHECK, `verification_status`, `document_status`, `decision_status`, `applicant_type`, `submitted_at`, `updated_at`. Index on `(student_id)`, `(university_id, status)`.
- [x] `schema/verifications.ts` — `verifications`: `id`, `code` text unique (short human code), `student_id` FK, `application_id` FK nullable, `bank_id` FK→organizations nullable, `guardian_id` FK nullable, `requested_amount` integer (minor units), `verified_amount` integer nullable, `currency` text (ISO-4217), `status` text CHECK, `rejection_reason`, `submitted_at`, `decided_at`, `verified_at`. Index on `(student_id)`, `(bank_id, status)`, `(code)`.
- [x] `schema/documents.ts` — `documents`: `id`, `owner_id` FK→users, `kind` text CHECK, `status` text CHECK, `application_id` nullable FK, `verification_id` nullable FK, `storage_key` text unique (relative path inside `STORAGE_DIR`), `file_name`, `mime_type`, `size_bytes` integer, `uploaded_at`, `reviewed_at`. Index on `(owner_id)`, `(application_id)`, `(verification_id)`.
- [x] `schema/sessions.ts` — `sessions`: `id` (SHA-256 of token), `user_id` FK, `created_at`, `expires_at` integer millis, `ip`, `user_agent`, `revoked_at` nullable. Index on `user_id`, `expires_at`.
- [x] `schema/rate_limits.ts` — `rate_limits`: `key` PK (e.g. `ip:/auth/login`), `window_start` integer millis, `count` integer. Used by the KV-less local rate limiter.
- [x] `schema/audit_log.ts` — `audit_log`: `id`, `actor_user_id`, `action` text, `entity_type` text, `entity_id` text, `metadata` text (stringified JSON, Zod-parsed at read time), `created_at`, `ip`. Index on `(entity_type, entity_id)`.
- [x] `schema/password_resets.ts` — `password_resets`: `id`, `user_id` FK, `token_hash` unique, `expires_at`, `used_at`. Index on `token_hash`.
- [x] `schema/index.ts` — barrel re-exporting all tables and a `schema` object for Drizzle.
- [x] Create `apps/api/drizzle.config.ts` — `dialect: "sqlite"`, `schema: "./src/db/schema"`, `out: "./migrations"`, `driver` unset (we run migrations via our own runner, see below).
- [x] Generate initial migration: `cd apps/api && bunx drizzle-kit generate --name=init`. Review `migrations/0000_init.sql` — every table and index present, no SQLite-only syntax (`AUTOINCREMENT`, `WITHOUT ROWID`, etc.). (14 tables + 26 indexes, `grep -Ei 'autoincrement|without rowid'` returns no matches.)
- [x] Create `apps/api/src/db/migrate.ts` — a small CLI: opens the DB, runs `migrate(db, { migrationsFolder: "./migrations" })` from `drizzle-orm/bun-sqlite/migrator`. Exits non-zero on failure. (Reads `DATABASE_URL` via `resolveDatabasePath`; defaults to `file:./.data/verifly-dev.sqlite`.)
- [x] Wire `bun run db:migrate` → `bun run src/db/migrate.ts`.
- [x] Verify: `bun run db:migrate` creates `.data/verifly-dev.sqlite` and `sqlite3 .data/verifly-dev.sqlite ".tables"` lists every table.
- [ ] Commit: `feat(api): initial SQLite schema + migration runner`.

## Phase 4 — Core API infrastructure

- [x] Create `apps/api/src/lib/errors.ts` — `AppError` with `status`, `code`, `message`, `details?`; subclasses `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `RateLimitError`.
- [x] Create `apps/api/src/middleware/request-id.ts` — attaches `nanoid()` as `c.set("requestId", id)`, echoes `X-Request-ID` on the response.
- [x] Create `apps/api/src/middleware/logger.ts` — structured JSON logs to stdout: `{ level, ts, request_id, method, path, status, duration_ms, user_id? }`.
- [x] Create `apps/api/src/middleware/error-handler.ts` — converts `AppError` to `{ error: { code, message, details? }, request_id }` with the right status; unknown errors to 500 with a generated `request_id`; never leak stack traces in `APP_ENV=prod`.
- [x] Create `apps/api/src/lib/validate.ts` — `validate(schema, target: "body"|"query"|"params")` Hono middleware wrapping Zod; on failure throw `ValidationError`.
- [x] Create `apps/api/src/lib/responses.ts` — `ok(data)`, `created(data)`, `paginated(items, { cursor, hasMore })`, `empty()`.

### 4.1 — Platform abstraction (portability layer)

Goal: route handlers and services never touch `bun:sqlite`, the filesystem, or `process.env` directly. They only touch `ctx.*`. Today `ctx` is backed by the `local` adapter; Phase 15 adds an `aws` adapter, and only `platform/index.ts` changes to switch.

- [x] Create `apps/api/src/platform/ports.ts` — provider-agnostic interfaces:
  - `DbPort` — returns the Drizzle-typed handle; signature matches `drizzle-orm/bun-sqlite`'s return type so services don't change when the driver swaps to `drizzle-orm/node-postgres`.
  - `SessionStorePort` — `{ get(key), set(key, value, ttlSeconds), delete(key), deleteByPrefix(prefix) }`.
  - `ObjectStoragePort` — `{ presignUpload({ key, mimeType, maxBytes, expiresInSec }), presignDownload(key, expiresInSec), head(key), delete(key) }`.
  - `EmailPort` — `{ send({ to, template, data }) }`.
  - `SecretsPort` — `{ get(name): string }` (reads a validated env bag in local; AWS Secrets Manager later).
  - `Clock` — `{ now(): number }` (millis; injectable for tests).
  - `Ctx` — `{ db: DbPort; sessions: SessionStorePort; storage: ObjectStoragePort; email: EmailPort; secrets: SecretsPort; clock: Clock; env: "dev" | "test" | "prod"; requestId: string }`.
- [x] Create `apps/api/src/platform/local/` with one adapter per port:
  - `db.ts` — opens `bun:sqlite`, returns the Drizzle handle.
  - `sessions.ts` — backed by the `sessions` table with TTL enforcement on read; swept periodically by the cron worker (Phase 14).
  - `storage.ts` — filesystem under `STORAGE_DIR` (default `apps/api/.storage/`); presigning = HMAC of `key|method|expiresAt` with `SESSION_PEPPER`; URLs look like `http://localhost:8787/storage/<key>?exp=<ts>&sig=<hex>`.
  - `email.ts` — `send()` writes the rendered message to stdout (and to a `./.data/outbox/*.json` file for test assertions). Provider swap lives in Phase 11.
  - `secrets.ts` — reads a Zod-validated env bag from `process.env` once at startup.
  - `index.ts` — exports `createLocalContext({ env, requestId }): Ctx`.
- [x] Create `apps/api/src/platform/index.ts` — re-exports `Ctx` and the default adapter as `createContext`. Phase 15 adds `platform/aws/` and the switch here gates on `APP_ENV`.
- [x] Wire into `src/app.ts`: middleware order is `requestId → logger → ctx → errorHandler → routes`. `ctx` middleware sets `c.set("ctx", createContext({ env, requestId: c.get("requestId") }))`.
- [x] Update Hono generics: `new Hono<{ Variables: { ctx: Ctx; requestId: string; user?: User } }>()`.
- [x] Convention: services accept `ctx: Ctx` as their first argument (e.g. `createApplication(ctx, input)`). Routes read `const ctx = c.get("ctx")` and pass it in. No service file imports `bun:sqlite`, `node:fs`, or `process.env`.
- [x] Add an ESLint `no-restricted-imports` rule in `apps/api/eslint.config.js`: files under `src/routes/` and `src/services/` cannot import from `src/platform/local/**` or directly from `bun:sqlite` / `node:fs` — only from `src/platform` (the neutral barrel).
- [x] Verify: `grep -R "bun:sqlite\|node:fs\|process\.env" apps/api/src --include="*.ts" | grep -v "platform/local\|db/migrate\|server\.ts"` → empty. (Also excluded `db/client` and `*.test.ts`; `db/client.ts` is a Phase 2 primitive that `platform/local/db.ts` wraps, and test files legitimately touch `node:fs` for tmp dirs.)
- [x] Verify: throwing `new NotFoundError("student")` in a test route returns `{ error: { code: "not_found", ... }, request_id: "..." }` with status 404. (Covered by `src/middleware/error-handler.test.ts`.)
- [ ] Commit: `feat(api): core middleware, error types, platform abstraction (local adapter)`.

## Phase 5 — Auth subsystem (self-built)

### 5.1 — Password hashing

- [x] Create `apps/api/src/lib/crypto/password.ts`:
  - `hashPassword(plain: string): Promise<string>` — argon2id via `@noble/hashes/argon2` with `t=3, m=65536, p=1`, salt from `crypto.getRandomValues(16)`. Return format: `argon2id$v=19$m=65536,t=3,p=1$<salt_b64>$<hash_b64>`.
  - `verifyPassword(plain: string, stored: string): Promise<boolean>` — parse format, re-hash, constant-time compare.
  - Export `PASSWORD_MIN_LEN = 12`.
  - Mixes `SESSION_PEPPER` (from `ctx.secrets`) into the hash input so a DB-only dump is not enough to attempt offline cracking.
- [x] Unit tests (`password.test.ts`): hash→verify round trip, wrong password fails, malformed stored string rejects, pepper mismatch fails.

### 5.2 — Session store (SQLite-backed)

- [x] Create `apps/api/src/services/sessions.ts` (uses `ctx.sessions` + `ctx.db` + `ctx.clock`):
  - `createSession(ctx, { userId, ip, userAgent }): Promise<{ token, expiresAt }>` — generate 32 random bytes, base64url-encode as `token`; store `{ userId, createdAt, ip, userAgent }` under key `SHA-256(token)` via `ctx.sessions.set(..., ttlSeconds=2_592_000)`. The local adapter writes to the `sessions` table with `expires_at = ctx.clock.now() + ttl*1000`.
  - `readSession(ctx, token): Promise<SessionRecord | null>` — `ctx.sessions.get(SHA-256(token))`; the local adapter filters out rows with `expires_at <= now` or `revoked_at not null`.
  - `revokeSession(ctx, token): Promise<void>`.
  - `revokeAllForUser(ctx, userId): Promise<void>` — `ctx.sessions.deleteByPrefix(...)` (local adapter: `UPDATE sessions SET revoked_at = now WHERE user_id = ?`).
- [x] Unit tests: create → read → revoke flow; expired session returns null; revoked session returns null.

### 5.3 — Auth routes

- [x] Create `apps/api/src/routes/auth/index.ts` — a Hono sub-router mounted at `/auth`.
- [x] `POST /auth/register` — body `{ email, password, role, name }`. Zod validate. 409 if email exists. Hash password, insert `users`. **Do not auto-login** (enumeration defense). Response: `{ user: { id, email, role, name } }`. Side effect: enqueue verify email via `ctx.email.send(...)` (console log in local until Phase 11).
- [x] `POST /auth/login` — body `{ email, password }`. Lookup by email, verify password in constant time (run dummy verify if user missing). On success create session, set `sid=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`. Response: `{ user: {...} }`. Fail: 401, generic message.
- [x] `POST /auth/logout` — read `sid`, revoke, clear cookie.
- [x] `GET /auth/me` — requires auth; returns current user.
- [x] `POST /auth/password/forgot` — body `{ email }`. Always 204 (no enumeration). If user exists, create `password_resets` row with 1-hour TTL; log/email the reset link.
- [x] `POST /auth/password/reset` — body `{ token, new_password }`. Verify, update hash, mark used, revoke all sessions for the user.
- [x] `POST /auth/password/change` (deviation: revokes all sessions then re-issues one for the current cookie, rather than filtering out the current session — covered in learningguide §18) — auth required. Body `{ current_password, new_password }`. Verify current, update, revoke other sessions.

### 5.4 — Auth middleware & RBAC

- [x] Create `apps/api/src/middleware/auth.ts`:
  - `requireAuth` — reads `sid` cookie, calls `readSession`, attaches `c.set("user", user)` or throws `UnauthorizedError`.
  - `requireRole(...roles)` — factory throwing `ForbiddenError` on mismatch.
  - `requireSelfOrRole(paramName, ...roles)` — allows if `params[paramName] === user.id` OR role matches.
- [x] Create `apps/api/src/middleware/csrf.ts`:
  - Issue a CSRF token on login (cookie `csrf=<random>; SameSite=Lax` readable by JS).
  - On `POST`/`PATCH`/`PUT`/`DELETE`, require header `X-CSRF-Token` to equal the cookie. GET exempt.
  - Skip CSRF for routes tagged `{ public: true }` (e.g. `/auth/login`, `/auth/register`, `/auth/password/forgot`).

### 5.5 — Rate limiting

- [x] Create `apps/api/src/middleware/rate-limit.ts` using the `rate_limits` table (windowed counters keyed by `ip:<route>` or `user:<id>:<route>`). Atomic `INSERT ON CONFLICT DO UPDATE SET count = count + 1` inside a transaction; window resets when `now - window_start > window_ms`.
- [x] Stricter limits on `/auth/login`, `/auth/register`, `/auth/password/forgot` (10 / 15 min / IP).
- [ ] Default limit (120 req/min/user) on everything else. (Deferred to Phase 7: needs to sit after auth so it can subject on user.id; applying by-IP globally would trigger on `/health` and break CI smoke tests. The middleware factory is ready to be mounted per-router in Phase 7.)
- [x] Verify: hammering `/auth/login` with wrong password trips the limit and returns 429. (Integration test in `src/routes/auth/auth.test.ts`.)

### 5.6 — Auth integration check

- [x] End-to-end test: register → login → GET `/auth/me` with cookie → logout → GET `/auth/me` → 401. (`src/routes/auth/auth.test.ts`.)
- [ ] Commit: `feat(api): self-built auth (argon2 + pepper, SQLite sessions, CSRF, rate limit)`.

## Phase 6 — Shared API client package

- [x] Create `packages/api-client/`:
  - [x] `package.json` — name `@verifly/api-client`, exports `./src/index.ts`.
  - [x] `tsconfig.json` extending `@verifly/config/tsconfig.base.json`.
  - [x] `src/client.ts` — typed `fetch` wrapper: `createClient({ baseUrl, credentials: "include" })` returning `{ get, post, patch, del }`. Auto-injects `X-CSRF-Token` from the `csrf` cookie.
  - [x] `src/errors.ts` — mirror of server error codes as `ApiError`.
  - [x] `src/types/*` — re-exports `@verifly/types` plus wire DTOs (e.g. paginated wrapper).
  - [x] `src/endpoints/auth.ts`, `students.ts`, `applications.ts`, `verifications.ts`, `documents.ts` — one function per server route, fully typed. (Also added `users.ts` and `organizations.ts` to cover Phase 7 endpoints.)
  - [x] `src/index.ts` — barrel.
- [x] Add `@verifly/api-client` as a dep in each of the 5 apps' `package.json`.
- [x] Verify: `bun install` at root; types resolve in each app.
- [x] Commit: `feat(api-client): typed cross-app client package`.

## Phase 7 — Domain APIs

All routes live under `apps/api/src/routes/`. Each module owns: route definitions, Zod schemas, service functions in `src/services/<entity>.ts` that take `Ctx` as their first arg. Routes are thin; business logic goes in services for testability. **No service or route imports from `platform/local/**` or `bun:sqlite` — always through `ctx`.**

### 7.1 — Users & profiles

- [x] `GET /users/me` — returns user + attached profile (student/counselor/bank/university) by role.
- [x] `PATCH /users/me` — update name, email (with re-verification flag).
- [x] `DELETE /users/me` — soft delete (sets `deleted_at`, revokes sessions).

### 7.2 — Students

- [x] `POST /students` — create student profile for the current user (role must be `student`; 409 if exists).
- [x] `GET /students/:id` — readable by self, counselor-of, admin, or university where an application links them.
- [x] `PATCH /students/:id` — self or admin only.
- [x] `GET /students` — admin only; paginated `?cursor&limit&q`.
- [x] `GET /students/:id/guardians` / `POST .../guardians` / `PATCH .../guardians/:gid` / `DELETE .../guardians/:gid`.

### 7.3 — Organizations

- [x] `GET /organizations?kind=university|bank` — public-ish, paginated, used by student signup.
- [x] `GET /organizations/:id` — public.
- [x] `POST /organizations` — admin only.
- [x] `PATCH /organizations/:id` — admin only.

### 7.4 — Applications

- [x] `POST /applications` — student creates an application to a university.
- [x] `GET /applications/:id` — student owner, receiving university, counselor of the student, or admin.
- [x] `PATCH /applications/:id` — status transitions via a state machine (7.4.1).
- [x] `GET /applications` — list scoped by caller (student→own, university→received, counselor→students', admin→all). `?status`, `?cursor`, `?limit`.
- [x] 7.4.1 `src/services/application-state.ts` — explicit transitions:
  - `draft → submitted` (student)
  - `submitted → under_review` (university)
  - `under_review → awaiting_info | awaiting_verification | committee_review` (university)
  - `committee_review → admitted | rejected | waitlisted | conditionally_admitted` (university)
  - Reject any transition not in the table with 409 `invalid_transition`.

### 7.5 — Verifications

- [x] `POST /verifications` — student or counselor initiates `{ applicationId?, bankId, requestedAmount, currency, guardianId? }`. Generate human-friendly `code` (e.g. `VF-7K3Q`). Status starts `pending_submission`. (Added `pending_submission` to `verificationStatuses` enum + migration `0001_add-pending-submission-status.sql`.)
- [x] `POST /verifications/:id/submit` — student transitions `pending_submission → pending`.
- [x] `GET /verifications/:id` — owner, bank, linked university, admin.
- [x] `PATCH /verifications/:id/decision` — bank only. `{ decision, verifiedAmount?, rejectionReason? }`. Writes `decided_at`/`verified_at`; cascades to linked `application.verification_status`.
- [x] `GET /verifications` — scoped by caller.
- [x] `GET /verifications/lookup/:code` — bank only; quick code lookup.

### 7.6 — Documents (metadata only; uploads in Phase 8)

- [x] `POST /documents` — create metadata row, return `{ id, uploadUrl }` (presigned PUT).
- [x] `POST /documents/:id/complete` — client calls after upload; verifies object exists via `ctx.storage.head(key)`, sets `uploaded_at` + `status=uploaded`.
- [x] `GET /documents/:id` — returns metadata + short-lived download URL.
- [x] `PATCH /documents/:id/review` — admin / university / bank set `status=approved|needs_replacement` + optional `note`.
- [x] `DELETE /documents/:id` — owner or admin; soft delete + `ctx.storage.delete(key)`.

### 7.7 — Audit log

- [x] Create `src/services/audit.ts` — `audit(ctx, { actor, action, entity, metadata })` inserts into `audit_log` via `ctx.db`.
- [x] Call `audit()` from every state-changing route (login, logout, password change, application decision, verification decision, document review). (Phase 7 routes all call `audit()`. Auth routes from Phase 5 will be wired with audit calls in Phase 11.6 audit completeness review.)
- [x] `GET /audit?entity_type=&entity_id=` — admin only.

- [x] Verify Phase 7 end-to-end: integration tests covering the golden path (student signup → profile → application → verification → decision → document upload). (`src/routes/domain.test.ts` — 40 assertions, full golden path: admin org setup → student register → profile + guardian → /users/me → application create + submit + invalid transition → verification create + submit + bank lookup + decision → document create + upload complete + review → audit log query.)
- [ ] Commit: `feat(api): domain routes for users/students/apps/verifications/docs`.

## Phase 8 — Local object storage

- [x] Create `apps/api/.storage/` (gitignored). Default `STORAGE_DIR=./.storage`. (Already in `.gitignore` from Phase 1; `STORAGE_DIR` env var with default `./.storage` already in `platform/local/secrets.ts` from Phase 4.1; `ensureStorageDir()` called at startup in `platform/local/index.ts`.)
- [x] Implement `apps/api/src/platform/local/storage.ts`:
  - Object key scheme: `documents/<owner_user_id>/<document_id>/<filename>`; resolved to an absolute path under `STORAGE_DIR` with path-traversal protection (reject keys containing `..`, leading `/`, or backslashes).
  - `presignUpload({ key, mimeType, maxBytes, expiresInSec })` → `{ url, headers }` where `url = /storage/<key>?exp=<ts>&sig=<hmac>` and the HMAC is over `PUT|<key>|<exp>|<mimeType>|<maxBytes>` using `SESSION_PEPPER`.
  - `presignDownload(key, expiresInSec)` → signed `GET` URL.
  - `head(key)` / `delete(key)` via `node:fs/promises`.
  - (Already implemented in Phase 4.1/7 with `assertSafeKey`, `resolveStoragePath`, `verifyUploadSignature`, `verifyDownloadSignature`, constant-time HMAC comparison.)
- [x] Add signed-URL routes in `apps/api/src/routes/storage.ts`:
  - `PUT /storage/*` — verify signature, enforce `Content-Type` and max size, stream body to disk atomically (write to `.tmp` then rename).
  - `GET /storage/*` — verify signature, stream from disk with correct `Content-Type` (guessed from file extension: pdf, png, jpg/jpeg).
  - These routes bypass CSRF (added `/storage/` to `PUBLIC_CSRF_EXEMPT` in `app.ts`) and have their own rate limit (`ip:/storage`, 60/min).
  - Mounted via `app.route("/storage", createStorageRouter())` in `app.ts`.
- [x] Enforce per-kind constraints in `POST /documents` service: allowed mime types (`application/pdf`, `image/png`, `image/jpeg`), max size 25 MB. (Already implemented in Phase 7.6 in `services/documents.ts` — `ALLOWED_MIME_TYPES` and `MAX_FILE_SIZE` constants.)
- [x] Virus scan stub: `src/services/scan.ts` with `scanDocument(ctx, storageKey)` that returns `{ isSafe: true }`. Wired into `completeDocumentUpload` — on scan failure, the file is deleted and a `ValidationError` is thrown. Phase 11 swaps for a real scanner.
- [x] Smoke test: `src/routes/storage.test.ts` — 4 tests: full round-trip (create doc → PUT → complete → GET → byte equality), tampered signature rejection (403), max size enforcement (400), expired signature rejection (403). All pass.
- [x] Commit: `feat(api): local filesystem document storage with HMAC-signed URLs`. (Pushed to `main` as `9c51882`.)

## Phase 9 — Role-scoped aggregate endpoints

Each portal has dashboard views that would otherwise need 3+ round-trips. Add thin aggregates.

- [x] `GET /portal/student/dashboard` — counts: active applications, pending verifications, outstanding documents; plus last 10 audit entries touching the student.
- [x] `GET /portal/university/dashboard` — counts by application status, last 10 submissions, verifications pending review.
- [x] `GET /portal/bank/dashboard` — counts of `pending`/`under_review` verifications, last 10 decisions, median time-to-decision.
- [x] `GET /portal/counselor/dashboard` — list of the counselor's students with application-progress summaries. (No counselor↔student mapping table yet — returns all non-deleted students, matching the broad counselor read access already used in `routes/applications`. Narrow by school mapping in a later phase.)
- [x] `GET /portal/admin/dashboard` — platform-wide counts (users by role, applications by status, verifications by status, error rate last 24h). (`errorRateLast24h` returns `null` until Phase 12's `request_metrics` table exists; the field is declared now so the admin frontend can bind against the stable DTO shape.)
- [x] Each endpoint reuses Phase 7 services; no raw SQL outside the service layer. (All aggregation lives in `src/services/portal-dashboards.ts` via Drizzle query builder.)
- [ ] Commit: `feat(api): portal dashboard aggregates`.

## Phase 10 — Frontend integration

Replace mock data with `@verifly/api-client` calls. One app at a time; verify in a browser before moving on.

- [ ] Env var in each app: `VITE_API_BASE_URL` (dev: `http://localhost:8787`). AWS URLs added in Phase 15.
- [ ] `apps/<x>/src/lib/api.ts` exports a per-app `apiClient` built from `createClient({ baseUrl })`.
- [ ] `apps/<x>/src/auth/AuthProvider.tsx` — React context that calls `GET /auth/me` on mount; exposes `user`, `login`, `logout`.
- [ ] **student** — migrate mock routes one at a time; delete `apps/student/src/lib/mock-data.ts` last.
- [ ] **university** — swap `lib/types.ts` mock generators for API calls.
- [ ] **bank** — swap mock verifications list/detail/decision flow.
- [ ] **counselor** — swap mock students/requests flows.
- [ ] **admin** — delete `apps/admin/src/lib/admin-mock/` once all routes bind to API.
- [ ] After each app: run the app, walk the golden path, fix any DTO mismatches in `@verifly/api-client` or `@verifly/types`.
- [ ] Verify: `grep -R "mock" apps/ | grep -v node_modules` returns nothing substantive.
- [ ] Commit per app: `refactor(<app>): replace mocks with @verifly/api-client`.

## Phase 11 — Security & production hardening

### 11.1 — CORS

- [ ] `src/middleware/cors.ts` using Hono's `cors`. Allowed origins from `ALLOWED_ORIGINS` (comma-separated). Dev: all 5 `http://localhost:<port>`.
- [ ] `credentials: true`, `allowHeaders: ["Content-Type", "X-CSRF-Token", "X-Request-ID"]`, `exposeHeaders: ["X-Request-ID"]`.
- [ ] Verify: a cross-origin request from each portal's dev URL succeeds with cookies.

### 11.2 — Security headers

- [ ] Middleware: `Strict-Transport-Security` (skipped in local http), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: ...`.
- [ ] CSP for any HTML responses (probably only `/`).

### 11.3 — Secrets & env vars

- [ ] Define required env at startup: `APP_ENV` (`dev`/`test`/`prod`), `PORT`, `DATABASE_URL`, `STORAGE_DIR`, `SESSION_PEPPER`, `COOKIE_DOMAIN`, `ALLOWED_ORIGINS`.
- [ ] Zod-validate `process.env` on boot via `platform/local/secrets.ts`; log all missing keys and `process.exit(1)` before the server listens.
- [ ] `.env.example` kept current; README documents how to generate `SESSION_PEPPER`.

### 11.4 — Email sending

- [ ] Pick a provider (Postmark, Resend, or SES). Add API key to `.env` / secrets.
- [ ] Create `src/services/email.ts` with templates: `verify-email`, `password-reset`, `verification-decision`, `application-decision`. Wrapped by `ctx.email.send()`.
- [ ] Swap the stdout-only stub from Phase 5 for real sends; keep the `.data/outbox/*.json` mirror on `APP_ENV=dev` for local inspection.
- [ ] Fire-and-forget the send using an async helper that catches and logs (no `ctx.executionCtx.waitUntil`-equivalent needed; Bun doesn't terminate on response return).

### 11.5 — Input hardening

- [ ] All Zod schemas: `.strict()` on objects; explicit length caps (email ≤254, name ≤100, free text ≤2000).
- [ ] Max request body size middleware: 1 MB JSON; 25 MB only for `PUT /storage/*`.
- [ ] Reject unexpected `Content-Type`s.

### 11.6 — Audit completeness

- [ ] Code review: every state-changing service writes an `audit_log` row.
- [ ] Test that iterates the route table and fails if a non-GET route lacks an audit call.

### 11.7 — Legal/compliance basics

- [ ] `docs/data-retention.md` — soft-deleted users purged after 90 days, audit log retained 2 years.
- [ ] Wire the retention purge into the cron worker (Phase 14).
- [ ] Commit: `chore(api): security hardening + real email + audit completeness`.

## Phase 12 — Observability

- [ ] Structured logging already in Phase 4; add one log at request start, one at end (duration, status).
- [ ] `src/routes/internal/metrics.ts` — admin-only `GET /internal/metrics` aggregating from D1: requests/day, error rate, p50/p95 latency (requires `request_metrics` table, 12.1).
- [ ] 12.1 `schema/request_metrics.ts` — `id`, `route`, `method`, `status`, `duration_ms`, `created_at`. Inserted asynchronously (fire-and-forget with error swallow-and-log).
- [ ] Wire Sentry (or equivalent) for unhandled exceptions via `@sentry/bun`. Disabled in `APP_ENV=test`.
- [ ] Readiness/liveness split: `/health` stays simple; add `/ready` that checks DB reachability.
- [ ] Commit: `feat(api): observability + error monitoring`.

## Phase 13 — Testing

- [ ] `vitest.config.ts` — standard Node/Bun runner; no Workers pool. Tests that need a DB use a fresh temp-file SQLite or `:memory:` configured via a test helper.
- [ ] `tests/unit/` — services, password hashing, state machine, presigning math.
- [ ] `tests/integration/`:
  - Auth flows (register/login/logout/reset/change).
  - RBAC matrix — for each route × role, pass/fail assertions.
  - State machine — every allowed and disallowed transition.
  - Rate limiting trips at threshold.
  - CSRF rejects when header missing.
  - Signed URL tampering rejects.
- [ ] `tests/e2e/` (optional) — drive one frontend against a locally-running API with Playwright; golden path only.
- [ ] Targets: 80%+ line coverage in services, 100% in auth + state machine + storage signing.
- [ ] Scripts: `test`, `test:watch`, `test:coverage`.
- [ ] Pre-commit hook: `test` + `typecheck` + `lint` on changed packages.
- [ ] Commit: `test(api): unit + integration coverage for auth, RBAC, state machine, storage`.

## Phase 14 — Local dev operations & Postgres parity

### 14.1 — Multi-app dev ergonomics

- [ ] Root `package.json` script `dev:all` — run `@verifly/api` + the 5 frontends in parallel (use `bun run --filter` or `concurrently`). Color-prefixed logs.
- [ ] Root script `reset` — stop processes, delete `apps/api/.data/` + `apps/api/.storage/`, re-run migrations + seed.
- [ ] `apps/api/src/scripts/seed.ts` — idempotent seed: 1 admin, 2 universities, 2 banks, 3 students with guardians, 5 applications across lifecycle states, 3 verifications. Run via `bun run db:seed`.
- [ ] `apps/api/src/scripts/backup.ts` / `restore.ts` — tar `{.data,.storage}` to a timestamped archive; restore unpacks.

### 14.2 — Cron worker

- [ ] `apps/api/src/cron.ts` — a separate Bun entry that runs scheduled jobs (via `node-cron`). Jobs:
  - Hard-delete soft-deleted users older than 90 days.
  - Delete sessions with `expires_at < now`.
  - Delete `rate_limits` rows with `window_start` older than 24 h.
  - Delete `password_resets` with `used_at not null` older than 30 days.
  - Prune `request_metrics` older than 30 days.
- [ ] Runs daily at 02:00 local. On AWS this becomes EventBridge + a separate Lambda (Phase 15).
- [ ] Verify: `bun run cron:once` runs all jobs end-to-end against a test DB.

### 14.3 — Postgres parity track (optional but recommended before Phase 15)

- [ ] `docker-compose.yml` at repo root: a Postgres 16 service, named volume, exposed on 5432.
- [ ] Add a second Drizzle config `drizzle.postgres.config.ts` pointing at the same `src/db/schema/`. This will expose any schema elements that are SQLite-only.
- [ ] Write a `bun run db:verify-postgres` script that:
  - Starts Compose if not up.
  - Generates Postgres migrations from the same schema.
  - Diffs Postgres migration output vs SQLite migration output; fails on schema shape divergence (column types, nullability, FKs).
- [ ] Run the full `tests/integration/` suite against the Postgres target. Any failure signals a portability leak — fix the schema (stay in the intersection), not the test.
- [ ] This track runs **once a week** or before any schema change is merged — it does not block day-to-day local dev.
- [ ] Commit: `chore(api): local dev ops + Postgres parity track`.

## Phase 15 — AWS migration prep

No deploys happen here. The goal is to make Phase 15's follow-up (the actual AWS rollout, which is a separate project) a pure infra exercise — no application-code changes.

### 15.1 — Target architecture decision

- [ ] Document in `learningguide.md` §N the chosen AWS shape:
  - Compute: **API Gateway HTTP API + Lambda** (default), wrapped via `hono/aws-lambda`. Cold start acceptable for dashboards; switch to Fargate if p95 > 400 ms after warmup.
  - DB: RDS Postgres (Aurora Serverless v2 if budget allows; single-AZ db.t4g.micro if not).
  - Object storage: S3 with bucket policy denying public access; presigned URLs via AWS SDK.
  - Sessions: DynamoDB single-table (`pk=session#<hash>`, TTL attribute). Optional ElastiCache Redis if session volume demands it.
  - Email: SES (out of sandbox required before prod).
  - Secrets: AWS Secrets Manager (or Parameter Store SecureString for small config).
  - Cron: EventBridge rules → dedicated cron Lambda that imports the same job functions as Phase 14.2.
  - Logs: CloudWatch Logs; Sentry remains.
  - Networking: API Gateway public; Lambda in VPC private subnets with RDS; NAT for outbound.

### 15.2 — AWS adapter skeleton

- [ ] Create `apps/api/src/platform/aws/` with stub files mirroring `platform/local/`:
  - `db.ts` — uses `drizzle-orm/node-postgres` with a `pg.Pool` configured from Secrets Manager values.
  - `sessions.ts` — DynamoDB SDK; same `SessionStorePort` shape.
  - `storage.ts` — S3 SDK presigner; same `ObjectStoragePort` shape.
  - `email.ts` — SES `SendEmailCommand`.
  - `secrets.ts` — Secrets Manager (with a local `process.env` fallback for tests).
  - `index.ts` — `createAwsContext(event, requestId): Ctx`.
- [ ] Implement nothing past the type signatures — the Phase 15 follow-up project fills these in. The point of doing this now is to **fail the compile if the ports drift** while Phases 0–14 are still active.
- [ ] `platform/index.ts` — branch on `APP_ENV === "prod" || process.env.AWS_REGION` to pick `createAwsContext`; fall through to `createLocalContext` otherwise.

### 15.3 — Parity checklist (must be green before AWS deploy)

- [ ] SQLite → Postgres: every schema change in `src/db/schema/` has passed Phase 14.3's weekly verification; `docker-compose` Postgres runs the full integration suite.
- [ ] File I/O → S3: audit `grep -R "node:fs" apps/api/src --include="*.ts" | grep -v "platform/local"` → empty.
- [ ] `bun:sqlite` → `pg`: audit `grep -R "bun:sqlite" apps/api/src --include="*.ts" | grep -v "platform/local"` → empty.
- [ ] Environment: every env var in `platform/local/secrets.ts`'s Zod schema has a Secrets Manager entry documented in `docs/aws-env.md`.
- [ ] Sessions: session TTL behavior verified against DynamoDB TTL semantics (eventual, ~48 h skew acceptable).
- [ ] Cron: `apps/api/src/cron.ts` jobs are individually invocable (`bun run cron:once <job-name>`) so EventBridge can target one per rule.
- [ ] Commit: `chore(api): AWS migration prep (adapter skeleton, parity gates)`.

### 15.4 — Frontend retargeting (off Cloudflare)

All 5 frontends (`apps/admin`, `apps/bank`, `apps/counselor`, `apps/student`, `apps/university`) still build as Cloudflare Workers via `@cloudflare/vite-plugin` and each app's `wrangler.jsonc`. They must be retargeted before the AWS deploy so the whole stack lives in one cloud.

Context (from v2 pivot, 2026-04-23): the `@lovable.dev/vite-tanstack-config` preset each frontend uses already supports `cloudflare: false` as an escape hatch and forwards `tanstackStart` options straight through to TanStack Start's Nitro-style presets. Retarget is config-level, not a React rewrite.

- [ ] Audit each app for TanStack Start **server-function usage**: `grep -R "createServerFn\|useServerFn" apps/<name>/src`. If empty in all 5 apps → pick `static` (SPA) target. If any app uses server functions → pick `node-server` or `aws-lambda` for that app.
- [ ] Per-app, update `apps/<name>/vite.config.ts` to:
  ```ts
  export default defineConfig({
    cloudflare: false,
    tanstackStart: { target: "<chosen-target>" },
  });
  ```
- [ ] Per-app, delete `apps/<name>/wrangler.jsonc`.
- [ ] Remove `@cloudflare/vite-plugin` from the root `package.json` once all 5 apps are off Cloudflare; re-run `bun install` and verify `grep -E "wrangler|@cloudflare" bun.lock` now returns nothing.
- [ ] Verify per app: `cd apps/<name> && bun run build` succeeds under the new target; `bun run dev` still works locally.
- [ ] Document chosen target(s) in `learningguide.md` and pick the AWS deploy shape:
  - **If `static` (SPA) for all apps** → S3 + CloudFront (one bucket + one distribution per portal, or a single distribution with path-based routing).
  - **If `node-server` / `bun` (SSR)** → Fargate service behind an ALB, one task definition per app.
  - **If `aws-lambda`** → Lambda@Edge or standard Lambda behind CloudFront, one function per app.
- [ ] Confirm cookie-domain compatibility with the backend: the frontends' new hostnames must share the parent domain with the API so the `sid` cookie's `Domain=.verifly.<domain>` still covers both.
- [ ] Commit: `refactor(apps): retarget frontends off Cloudflare Workers`.

## Phase 16 — End-to-end verification

Do not tag the release until all pass:

- [ ] `bun install` at root: clean.
- [ ] `bun run build` in all 5 apps: clean.
- [ ] `bun run typecheck` + `lint` + `test` in `apps/api`: clean.
- [ ] `bun run db:verify-postgres` (Phase 14.3): clean.
- [ ] Fresh-DB migration: `bun run db:reset && bun run db:migrate && bun run db:seed` produces a working dev DB.
- [ ] Golden-path manual test on `localhost`, one full cycle per portal:
  - [ ] Student: register → login → create application → upload document → initiate verification → see status update.
  - [ ] University: login → see new application → move through state machine → issue decision.
  - [ ] Bank: login → see verification → review docs → issue decision.
  - [ ] Counselor: login → see students' progress.
  - [ ] Admin: login → see platform dashboard → review audit log.
- [ ] Local load test: `k6 run scripts/load-test.js` sustains 50 rps for 5 min with p95 < 400 ms, error rate < 0.5% on a single-laptop run.
- [ ] Security review: OWASP checklist (auth, authorization, injection, XSS via doc metadata, CSRF, rate limit, IDOR on every `:id`, signed-URL tamper).
- [ ] Tag the repo `api-v1.0.0-local`.
- [ ] Update `learningguide.md` with the final local architecture and decisions.
- [ ] Update root `README.md` with API overview, local dev instructions, and the AWS-deploy-deferred note pointing at Phase 15.

---

## Out of scope (follow-ups)

- Actual AWS deploy (infra provisioning, IaC, DNS, CI/CD). Tracked separately once Phase 15 parity gates are green.
- WebSocket/realtime updates — add when moving to AWS (API Gateway WebSocket or AppSync).
- Payment integration (Stripe) — separate track.
- Admin impersonation — deliberately deferred; requires extra audit rigor.
- Multi-tenant isolation beyond role scoping — not needed at current scale.
- Full PII encryption at rest beyond defaults — revisit during legal review.

---

## Dependency graph

```
0 Pre-flight & reset (undo Cloudflare scaffold)
  └─ 1 Rescaffold apps/api (Bun + Hono)
      └─ 2 SQLite provisioning
          └─ 3 Schema + migrations (SQLite ∩ Postgres)
              └─ 4 Core infra (middleware, errors, validation)
                  └─ 4.1 Platform abstraction (Ctx + ports + local adapter)
                      └─ 5 Auth (depends on 3, 4, 4.1)
                          └─ 6 API client package
                              └─ 7 Domain APIs (depends on 4, 5, 6)
                                  ├─ 8 Local object storage (parallelizable with 7.1–7.5)
                                  └─ 9 Portal aggregates (after 7)
                                      └─ 10 Frontend integration (per app, sequential)
                                          └─ 11 Security hardening
                                              └─ 12 Observability
                                                  └─ 13 Testing
                                                      └─ 14 Local dev ops + Postgres parity
                                                          └─ 15 AWS migration prep
                                                              └─ 16 End-to-end local ship
```
