# Verifly Backend — Execution Checklist

Sequential, atomic build plan for the Verifly backend.

**Stack:** Cloudflare Workers + D1 (SQLite) + R2 (objects) + Workers KV (sessions) + Hono (router) + Drizzle ORM + Zod (validation). Self-built email/password auth with HttpOnly cookie sessions.

**Deliverable:** A single `apps/api` Worker that serves all 5 portals (`admin`, `bank`, `counselor`, `student`, `university`) against one shared database, role-scoped.

**Hard rules (from AIRULES.md):**
- Tick each box inline as you complete the task (update this file with the code, not after).
- Update `learningguide.md` after every phase with what/why/how.
- Follow `namingconventions.md` strictly.
- Never skip verification steps.

Entities (canonical shapes already in `@verifly/types`): `User`, `Student`, `Guardian`, `Counselor`, `BankUser`, `Application`, `Verification`, `Document`.

---

## Phase 0 — Pre-flight

- [ ] Create a work branch from `main`: `git checkout -b backend/phase-0-bootstrap`.
- [ ] Record baseline: `bun install` at root succeeds; all 5 apps still build (`cd apps/<x> && bun run build` each).
- [ ] Install Wrangler globally if not already: `bun add -g wrangler` (or use `bunx wrangler`).
- [ ] Run `wrangler login` and confirm the Cloudflare account that owns the 5 frontend Workers.
- [ ] Decide and document: single prod account vs. separate prod/staging accounts. Default: **one account, two environments** (`dev`, `prod`) inside it. Record choice in `learningguide.md`.
- [ ] Decide and document the API base URL scheme. Default: `https://api.verifly.<domain>` for prod, `https://api-dev.verifly.<domain>` for dev.
- [ ] Confirm DNS/zone ownership in Cloudflare for the chosen domain. If not owned yet, stop and sort this out — Phase 11 (custom domain + CORS) depends on it.

## Phase 1 — Scaffold `apps/api`

- [ ] Create directory: `mkdir -p apps/api/src`.
- [ ] Create `apps/api/package.json`:
  - Name: `@verifly/api`.
  - Scripts: `dev` (`wrangler dev`), `deploy:dev`, `deploy:prod`, `build` (`wrangler deploy --dry-run --outdir=dist`), `typecheck`, `lint`, `test`.
  - Dependencies: `hono`, `drizzle-orm`, `zod`, `@noble/hashes` (for argon2id via WASM), `nanoid`.
  - DevDependencies: `wrangler`, `drizzle-kit`, `@cloudflare/workers-types`, `@types/bun`, `typescript`, `vitest`, `@cloudflare/vitest-pool-workers`.
- [ ] Create `apps/api/tsconfig.json` extending `@verifly/config/tsconfig.base.json`, with `types: ["@cloudflare/workers-types", "@types/bun"]` and `lib: ["ES2022"]` (no DOM).
- [ ] Create `apps/api/wrangler.jsonc`:
  - `name: "verifly-api-dev"` at top; use `env.prod.name = "verifly-api-prod"`.
  - `main: "src/index.ts"`, `compatibility_date` to today, `compatibility_flags: ["nodejs_compat"]`.
  - Empty bindings block (`d1_databases`, `r2_buckets`, `kv_namespaces`, `vars`) — fill in Phase 2/8.
  - `observability: { enabled: true }`.
- [ ] Create `apps/api/src/index.ts` with a minimal Hono app exporting `{ fetch: app.fetch }`. Single route: `GET /health` → `{ ok: true, service: "verifly-api", version: env.VERSION }`.
- [ ] Add `apps/api` to `bun.lock` via `bun install` at the root.
- [ ] Verify: `cd apps/api && bun run dev` starts Wrangler at `http://localhost:8787/health` and returns `{ ok: true }`.
- [ ] Verify: `cd apps/api && bun run typecheck` passes.
- [ ] Commit: `feat(api): scaffold @verifly/api worker with /health endpoint`.

## Phase 2 — D1 database provisioning

- [ ] Create the dev D1 database: `bunx wrangler d1 create verifly-dev`. Copy the returned `database_id`.
- [ ] Create the prod D1 database: `bunx wrangler d1 create verifly-prod`. Copy the returned `database_id`.
- [ ] Add to `wrangler.jsonc` under top-level `d1_databases`: `{ binding: "DB", database_name: "verifly-dev", database_id: "<dev-id>" }`.
- [ ] Under `env.prod.d1_databases` add the prod entry with the prod id.
- [ ] Update `apps/api/src/types/env.ts` (new file) exporting an `Env` interface with `DB: D1Database`. Wire Hono generics: `new Hono<{ Bindings: Env }>()`.
- [ ] Verify: `bun run dev` still boots; log `env.DB` exists.

## Phase 3 — Drizzle schema & migrations

- [ ] Create `apps/api/src/db/schema/` with one file per entity.
- [ ] `schema/users.ts` — table `users`: `id` (text PK, nanoid), `email` (text UNIQUE NOT NULL), `password_hash` (text NOT NULL), `role` (text NOT NULL — one of `UserRole`), `name` (text), `created_at`, `updated_at`, `deleted_at` (nullable). Add index on `email`.
- [ ] `schema/students.ts` — `students`: `id` PK, `user_id` FK→users, `first_name`, `last_name`, `full_name`, `country`, `nationality`, `gpa` (real), `university` (text), `intended_study` (text), timestamps, soft delete. Index on `user_id`.
- [ ] `schema/guardians.ts` — `guardians`: `id`, `student_id` FK→students, `full_name`, `relationship`, `email`, `phone`, timestamps.
- [ ] `schema/counselors.ts` — `counselors`: `id`, `user_id` FK→users, `school_name`, timestamps.
- [ ] `schema/bank_users.ts` — `bank_users`: `id`, `user_id` FK→users, `bank_id` (FK→organizations, nullable until Phase 3.5), timestamps.
- [ ] `schema/organizations.ts` — `organizations`: `id`, `kind` (text: `university` | `bank`), `name`, `slug` (unique), `country`, timestamps. Index on `(kind, slug)`.
- [ ] `schema/university_users.ts` — `university_users`: `id`, `user_id` FK→users, `university_id` FK→organizations, `title`, timestamps.
- [ ] `schema/applications.ts` — `applications`: `id`, `student_id` FK, `university_id` FK, `program`, `status` (text), `verification_status`, `document_status`, `decision_status`, `applicant_type`, `submitted_at`, `updated_at`. Index on `(student_id)`, `(university_id, status)`.
- [ ] `schema/verifications.ts` — `verifications`: `id`, `code` (unique short code), `student_id` FK, `application_id` FK nullable, `bank_id` FK→organizations nullable, `guardian_id` FK nullable, `requested_amount` (integer, minor units), `verified_amount` (integer nullable), `currency` (text, ISO-4217), `status` (text), `rejection_reason`, `submitted_at`, `decided_at`, `verified_at`. Index on `(student_id)`, `(bank_id, status)`, `(code)`.
- [ ] `schema/documents.ts` — `documents`: `id`, `owner_id` FK→users, `kind` (text), `status` (text), `application_id` nullable FK, `verification_id` nullable FK, `r2_key` (text UNIQUE), `file_name`, `mime_type`, `size_bytes` (integer), `uploaded_at`, `reviewed_at`. Index on `(owner_id)`, `(application_id)`, `(verification_id)`.
- [ ] `schema/sessions.ts` — `sessions`: `id` (token hash), `user_id` FK, `created_at`, `expires_at`, `ip`, `user_agent`, `revoked_at`. (Used as durable audit mirror; live session lookup happens in KV.) Index on `user_id`.
- [ ] `schema/audit_log.ts` — `audit_log`: `id`, `actor_user_id`, `action` (text), `entity_type`, `entity_id`, `metadata` (text JSON), `created_at`, `ip`. Index on `(entity_type, entity_id)`.
- [ ] `schema/password_resets.ts` — `password_resets`: `id`, `user_id` FK, `token_hash` (unique), `expires_at`, `used_at`. Index on `token_hash`.
- [ ] `schema/index.ts` — barrel re-exporting all tables and a `schema` object for Drizzle.
- [ ] Create `apps/api/drizzle.config.ts` pointing at the schema directory, `dialect: "sqlite"`, `driver: "d1-http"`, output `./migrations`.
- [ ] Generate the initial migration: `cd apps/api && bunx drizzle-kit generate --name=init`. Review `migrations/0000_init.sql` — confirm every table and index is present.
- [ ] Apply to dev: `bunx wrangler d1 migrations apply verifly-dev --local` (for local dev sqlite file), then `--remote` for the hosted dev DB.
- [ ] Verify: `bunx wrangler d1 execute verifly-dev --command ".tables"` lists all tables.
- [ ] Create a `bun run db:generate`, `db:migrate:local`, `db:migrate:dev`, `db:migrate:prod` script in `apps/api/package.json`.
- [ ] Commit: `feat(api): initial D1 schema + migration`.

## Phase 4 — Core API infrastructure

- [ ] Create `apps/api/src/lib/db.ts` exporting `getDb(env: Env)` that returns `drizzle(env.DB, { schema })`.
- [ ] Create `apps/api/src/lib/errors.ts` defining `AppError` with `status`, `code`, `message`, `details?`; plus concrete subclasses `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `RateLimitError`.
- [ ] Create `apps/api/src/middleware/error-handler.ts` converting thrown `AppError` to JSON responses and unknown errors to `500` with a generated `request_id` (never leak stack traces in prod).
- [ ] Create `apps/api/src/middleware/request-id.ts` attaching a `nanoid()` to every request and echoing it as `X-Request-ID`.
- [ ] Create `apps/api/src/middleware/logger.ts` emitting structured JSON logs: `{ level, ts, request_id, method, path, status, duration_ms, user_id? }`.
- [ ] Create `apps/api/src/lib/validate.ts` — a `validate(schema)` Hono middleware wrapping `zod` for body/query/params with a unified `ValidationError` payload shape.
- [ ] Create `apps/api/src/lib/responses.ts` with helpers: `ok(data)`, `created(data)`, `paginated(items, { cursor, hasMore })`, `empty()`.

### 4.1 — Platform abstraction (portability layer)

Goal: isolate Cloudflare-specific bindings so a future AWS migration swaps ~5 files instead of every route. Route handlers and services never touch `env.DB`, `env.DOCS`, `env.SESSIONS` directly — they receive a `Ctx` built by a platform factory.

- [ ] Create `apps/api/src/platform/ports.ts` — define provider-agnostic interfaces:
  - `DbPort` — returns a Drizzle-typed handle; signature matches current `drizzle-orm` API so services don't change.
  - `SessionStorePort` — `{ get(key), set(key, value, ttlSeconds), delete(key) }`.
  - `ObjectStoragePort` — `{ presignUpload(opts), presignDownload(key, ttl), head(key), delete(key) }`.
  - `EmailPort` — `{ send({ to, template, data }) }`.
  - `SecretsPort` — `{ get(name): string }`.
  - `Ctx` — `{ db: DbPort; sessions: SessionStorePort; storage: ObjectStoragePort; email: EmailPort; secrets: SecretsPort; env: "dev" | "prod"; requestId: string }`.
- [ ] Create `apps/api/src/platform/cloudflare/` with one adapter per port:
  - `db.ts` — wraps `drizzle(env.DB, { schema })`.
  - `sessions.ts` — wraps `env.SESSIONS` (KV) with the `SessionStorePort` shape.
  - `storage.ts` — wraps `env.DOCS` (R2) with S3-compatible presigning.
  - `email.ts` — Resend HTTPS call (provider-agnostic, but lives here for now).
  - `secrets.ts` — reads from `env.*` vars.
  - `index.ts` — exports `createCloudflareContext(env, requestId): Ctx`.
- [ ] Create `apps/api/src/platform/index.ts` — re-exports `Ctx` and the current adapter (`createCloudflareContext` as `createContext`). A future AWS port adds `apps/api/src/platform/aws/` with matching adapters; only this `index.ts` changes to switch.
- [ ] Wire into `src/index.ts`: a middleware runs `c.set("ctx", createContext(c.env, c.get("requestId")))` before any route executes.
- [ ] Update the `Hono` generics to `new Hono<{ Bindings: Env; Variables: { ctx: Ctx; requestId: string; user?: User } }>()`.
- [ ] Convention: services accept `ctx: Ctx` as their first argument (e.g. `createApplication(ctx, input)`). Routes read `const ctx = c.get("ctx")` and pass it in. No service file imports from `cloudflare-workers-types`.
- [ ] Add a lint rule (ESLint `no-restricted-imports` in `apps/api/eslint.config.js`): files under `src/routes/` and `src/services/` cannot import from `src/platform/cloudflare/**` — only from `src/platform` (the neutral barrel).
- [ ] Verify: grep — `grep -R "env\.DB\|env\.DOCS\|env\.SESSIONS" apps/api/src --include="*.ts" | grep -v "platform/cloudflare"` → empty.

- [ ] Wire middleware in `src/index.ts`: `requestId → logger → ctx → errorHandler → routes`.
- [ ] Verify: throwing `new NotFoundError("student")` in a test route returns `{ error: { code: "not_found", message: "..." }, request_id: "..." }` with status 404.
- [ ] Commit: `feat(api): core middleware, error types, platform abstraction`.

## Phase 5 — Auth subsystem (self-built)

### 5.1 — Password hashing

- [ ] Create `apps/api/src/lib/crypto/password.ts`:
  - `hashPassword(plain: string): Promise<string>` — uses argon2id via `@noble/hashes/argon2` with `t=3, m=65536, p=1`, salt from `crypto.getRandomValues(16)`. Return format: `argon2id$v=19$m=65536,t=3,p=1$<salt_b64>$<hash_b64>`.
  - `verifyPassword(plain: string, stored: string): Promise<boolean>` — parse format, re-hash, constant-time compare.
  - Export `PASSWORD_MIN_LEN = 12`.
- [ ] Unit tests (`password.test.ts`): hash→verify round trip, wrong password fails, malformed stored string rejects.

### 5.2 — Session store (KV)

- [ ] Create the KV namespace for dev: `bunx wrangler kv namespace create SESSIONS` (note the id).
- [ ] Repeat for prod: `bunx wrangler kv namespace create SESSIONS --env prod`.
- [ ] Add to `wrangler.jsonc` (top-level and `env.prod.kv_namespaces`) with binding `SESSIONS`.
- [ ] Extend `Env` type: `SESSIONS: KVNamespace`.
- [ ] Create `apps/api/src/services/sessions.ts` (uses `ctx.sessions` + `ctx.db`, never touches `env` directly):
  - `createSession(ctx, { userId, ip, userAgent }): Promise<{ token, expiresAt }>` — generate 32 random bytes, base64url-encode as `token`, store `SHA-256(token)` via `ctx.sessions.set(...)` with 30-day TTL, value `{ userId, createdAt, ip, userAgent }`. Mirror row to `sessions` table via `ctx.db`.
  - `readSession(ctx, token): Promise<SessionRecord | null>` — `ctx.sessions.get(SHA-256(token))`.
  - `revokeSession(ctx, token): Promise<void>` — `ctx.sessions.delete(...)` + mark `revoked_at` in D1 via `ctx.db`.
  - `revokeAllForUser(ctx, userId): Promise<void>` — enumerate via `ctx.db`, delete keys via `ctx.sessions`.
- [ ] Unit tests with `miniflare`/`vitest-pool-workers`: create → read → revoke flow.

### 5.3 — Auth routes

- [ ] Create `apps/api/src/routes/auth/index.ts` — a Hono sub-router mounted at `/auth`.
- [ ] `POST /auth/register` — body: `{ email, password, role, name }`. Validate with Zod. Reject if email exists (409). Hash password, insert `users` row, **do not auto-login** (prevents enumeration). Response: `{ user: { id, email, role, name } }`. Side effect: enqueue verification email (stub for now — log to console).
- [ ] `POST /auth/login` — body: `{ email, password }`. Lookup by email, verify password in constant time (run dummy verify if user missing). On success, create session, set HttpOnly cookie `sid=<token>; Secure; SameSite=Lax; Path=/; Max-Age=2592000`. Response: `{ user: {...} }`. On fail: 401, generic message.
- [ ] `POST /auth/logout` — read `sid` cookie, revoke session, clear cookie.
- [ ] `GET /auth/me` — requires auth; return current user.
- [ ] `POST /auth/password/forgot` — body: `{ email }`. Always return 204 (no enumeration). If user exists, create `password_resets` row with 1-hour TTL, log the reset link (replace with email send in Phase 11).
- [ ] `POST /auth/password/reset` — body: `{ token, new_password }`. Verify token, update password hash, mark token used, revoke all sessions for that user.
- [ ] `POST /auth/password/change` — auth required. Body: `{ current_password, new_password }`. Verify current, update, revoke other sessions.

### 5.4 — Auth middleware & RBAC

- [ ] Create `apps/api/src/middleware/auth.ts`:
  - `requireAuth` — reads `sid` cookie, calls `readSession`, attaches `c.set("user", user)` or throws `UnauthorizedError`.
  - `requireRole(...roles: UserRole[])` — factory that throws `ForbiddenError` if current user's role isn't in the allowlist.
  - `requireSelfOrRole(paramName, ...roles)` — allows if `params[paramName] === user.id` OR role matches.
- [ ] Create `apps/api/src/middleware/csrf.ts`:
  - Issue a CSRF token on login (cookie `csrf=<random>; SameSite=Lax` readable by JS).
  - On state-changing requests (`POST`/`PATCH`/`PUT`/`DELETE`), require header `X-CSRF-Token` to match cookie. GET is exempt.
  - Skip CSRF for routes tagged `{ public: true }` (e.g. `/auth/login`).

### 5.5 — Rate limiting

- [ ] Create `apps/api/src/middleware/rate-limit.ts` using KV with windowed counters keyed by `ip:<route>` or `user:<id>:<route>`.
- [ ] Apply stricter limits to `/auth/login`, `/auth/register`, `/auth/password/forgot` (10 / 15 min / IP).
- [ ] Apply default limit (120 req/min/user) to all other routes.
- [ ] Verify: hammering `/auth/login` with wrong password trips the limit and returns 429.

### 5.6 — Auth integration check

- [ ] End-to-end test: register → login → GET `/auth/me` with cookie → logout → GET `/auth/me` returns 401.
- [ ] Commit: `feat(api): self-built auth (argon2, KV sessions, CSRF, rate limit)`.

## Phase 6 — Shared API client package

- [ ] Create `packages/api-client/` with:
  - [ ] `package.json` — name `@verifly/api-client`, exports `./src/index.ts`.
  - [ ] `tsconfig.json` extending `@verifly/config/tsconfig.base.json`.
  - [ ] `src/client.ts` — a typed `fetch` wrapper: `createClient({ baseUrl, credentials: "include" })` returning an object with `get`, `post`, `patch`, `del`. Auto-injects `X-CSRF-Token` from cookie.
  - [ ] `src/errors.ts` — mirror of server error codes as `ApiError`.
  - [ ] `src/types/*` — re-export `@verifly/types` plus request/response DTOs specific to the wire (e.g. paginated wrapper).
  - [ ] `src/endpoints/auth.ts`, `students.ts`, `applications.ts`, `verifications.ts`, `documents.ts` — one function per server route, fully typed.
  - [ ] `src/index.ts` barrel.
- [ ] Add `@verifly/api-client` as a dependency in each of the 5 apps' `package.json`.
- [ ] Verify: `bun install` at root; types resolve in each app.
- [ ] Commit: `feat(api-client): typed cross-app client package`.

## Phase 7 — Domain APIs

All routes live under `apps/api/src/routes/`. Each module owns: route definitions, Zod schemas, service functions in `src/services/<entity>.ts` that take the `Ctx` from Phase 4.1 as their first argument. Routes are thin; business logic goes in services for testability. **No service or route imports from `platform/cloudflare/**` — always go through `ctx`.**

### 7.1 — Users & profiles

- [ ] `GET /users/me` — returns user + attached profile (student/counselor/bank/university) based on role.
- [ ] `PATCH /users/me` — update name, email (with re-verification flag).
- [ ] `DELETE /users/me` — soft delete (sets `deleted_at`, revokes sessions).

### 7.2 — Students

- [ ] `POST /students` — create student profile for the current user (role must be `student`; 409 if already exists).
- [ ] `GET /students/:id` — readable by self, counselor-of, admin, or university where an application links them.
- [ ] `PATCH /students/:id` — self or admin only.
- [ ] `GET /students` — admin only; paginated with `?cursor&limit&q`.
- [ ] `GET /students/:id/guardians` / `POST .../guardians` / `PATCH .../guardians/:gid` / `DELETE .../guardians/:gid`.

### 7.3 — Organizations (universities & banks)

- [ ] `GET /organizations?kind=university|bank` — public-ish, paginated, used by student signup to pick a university.
- [ ] `GET /organizations/:id` — public.
- [ ] `POST /organizations` — admin only.
- [ ] `PATCH /organizations/:id` — admin only.

### 7.4 — Applications

- [ ] `POST /applications` — student creates an application to a university.
- [ ] `GET /applications/:id` — student owner, university on the receiving end, counselor of the student, or admin.
- [ ] `PATCH /applications/:id` — status transitions via a state machine (see 7.4.1). Allowed roles depend on transition.
- [ ] `GET /applications` — list scoped by caller: student → own, university → received, counselor → their students', admin → all. Support `?status`, `?cursor`, `?limit`.
- [ ] 7.4.1 Implement `src/services/application-state.ts` with explicit transitions:
  - `draft → submitted` (student)
  - `submitted → under_review` (university)
  - `under_review → awaiting_info | awaiting_verification | committee_review` (university)
  - `committee_review → accepted | rejected | waitlisted | conditionally_admitted` (university)
  - Reject any transition not in the table with 409 `invalid_transition`.

### 7.5 — Verifications (bank portal core)

- [ ] `POST /verifications` — student or counselor initiates: `{ applicationId?, bankId, requestedAmount, currency, guardianId? }`. Generate human-friendly `code` (e.g. `VF-7K3Q`). Status starts `pending_submission`.
- [ ] `POST /verifications/:id/submit` — student transitions `pending_submission → pending`.
- [ ] `GET /verifications/:id` — owner, bank, linked university, admin.
- [ ] `PATCH /verifications/:id/decision` — bank only. Body `{ decision: "verified" | "rejected" | "more_info_needed", verifiedAmount?, rejectionReason? }`. Writes `decided_at`/`verified_at`, cascades to linked `application.verification_status`.
- [ ] `GET /verifications` — scoped by caller (same pattern as applications).
- [ ] `GET /verifications/lookup/:code` — bank only; quick code-based lookup.

### 7.6 — Documents (metadata only; uploads in Phase 8)

- [ ] `POST /documents` — create metadata row, return `{ id, uploadUrl }` (presigned R2 PUT).
- [ ] `POST /documents/:id/complete` — client calls after R2 upload succeeds; verifies object exists, sets `uploaded_at` and `status=uploaded`.
- [ ] `GET /documents/:id` — returns metadata + short-lived download URL (presigned GET).
- [ ] `PATCH /documents/:id/review` — admin / university / bank (depending on doc kind) set `status=approved|needs_replacement` + optional `note`.
- [ ] `DELETE /documents/:id` — owner or admin; soft delete + R2 delete.

### 7.7 — Audit log

- [ ] Create `src/services/audit.ts` — `audit(ctx, { actor, action, entity, metadata })` inserts into `audit_log` via `ctx.db`.
- [ ] Call `audit()` from every state-changing route (login, logout, password change, application decision, verification decision, document review).
- [ ] `GET /audit?entity_type=&entity_id=` — admin only.

- [ ] Verify Phase 7 end-to-end: integration tests covering the golden path (student signup → profile → application → verification → decision → document upload).
- [ ] Commit: `feat(api): domain routes for users/students/apps/verifications/docs`.

## Phase 8 — R2 document storage

- [ ] Create buckets: `bunx wrangler r2 bucket create verifly-documents-dev` and `verifly-documents-prod`.
- [ ] Add to `wrangler.jsonc` under top-level and `env.prod` `r2_buckets`: `{ binding: "DOCS", bucket_name: "..." }`.
- [ ] Extend `Env`: `DOCS: R2Bucket`.
- [ ] Extend `ObjectStoragePort` (Phase 4.1) — add `presignUpload({ key, mimeType, maxBytes, expiresIn })` and `presignDownload(key, expiresIn)` if not already present.
- [ ] Implement `apps/api/src/platform/cloudflare/storage.ts` — R2 presigned URLs via S3-compatible signing (15-minute PUT, 5-minute GET).
- [ ] Services call `ctx.storage.presignUpload(...)` / `ctx.storage.presignDownload(...)`. No route or service imports the Cloudflare adapter directly.
- [ ] Enforce object key scheme: `documents/<owner_user_id>/<document_id>/<filename>`.
- [ ] Enforce per-kind constraints in `POST /documents` service: allowed mime types (`application/pdf`, `image/png`, `image/jpeg`), max size 25 MB.
- [ ] Add virus scan stub: `src/services/scan.ts` with a `scan(r2Key)` that currently no-ops; wire the hook into `POST /documents/:id/complete` so Phase 11 can swap in a real scanner.
- [ ] Write a smoke test: create doc → PUT to presigned URL → complete → GET presigned download → verify bytes match.
- [ ] Commit: `feat(api): R2 document uploads with presigned URLs`.

## Phase 9 — Role-scoped aggregate endpoints

Each portal has dashboard/list views that would otherwise need 3+ round-trips. Add thin aggregate endpoints to keep frontends simple.

- [ ] `GET /portal/student/dashboard` — counts: active applications, pending verifications, outstanding documents; plus recent activity (last 10 audit entries touching the student).
- [ ] `GET /portal/university/dashboard` — counts by application status, last 10 submissions, verifications pending review.
- [ ] `GET /portal/bank/dashboard` — counts of `pending`/`under_review` verifications, last 10 decisions, SLA stats (median time-to-decision).
- [ ] `GET /portal/counselor/dashboard` — list of students under counselor with application progress summary.
- [ ] `GET /portal/admin/dashboard` — platform-wide counts (users by role, applications by status, verifications by status, error rate last 24h).
- [ ] Each endpoint reuses services from Phase 7 — no raw SQL outside the service layer.
- [ ] Commit: `feat(api): portal dashboard aggregates`.

## Phase 10 — Frontend integration

For each app, replace mock data with `@verifly/api-client` calls. Do one app at a time; verify visually and functionally before moving to the next.

- [ ] Add env var handling in each app: `VITE_API_BASE_URL` (dev: `http://localhost:8787`, prod: `https://api.verifly.<domain>`).
- [ ] Create `apps/<x>/src/lib/api.ts` exporting a per-app `apiClient` built from `createClient({ baseUrl })`.
- [ ] Create `apps/<x>/src/auth/AuthProvider.tsx` — React context that calls `GET /auth/me` on mount, exposes `user`, `login`, `logout`.
- [ ] **student** — migrate mock routes one at a time; replace mock-data imports with `apiClient` calls. Delete `apps/student/src/lib/mock-data.ts` last.
- [ ] **university** — same pattern; swap `lib/types.ts` mock generators for API calls.
- [ ] **bank** — swap mock verifications list/detail/decision flow.
- [ ] **counselor** — swap mock students/requests flows.
- [ ] **admin** — delete `apps/admin/src/lib/admin-mock/` entirely once all routes bind to API.
- [ ] After each app: run the app in a browser, walk the golden path, fix any DTO mismatches in `@verifly/api-client` or `@verifly/types`.
- [ ] Verify: `grep -R "mock" apps/ | grep -v node_modules` returns nothing substantive.
- [ ] Commit per app: `refactor(<app>): replace mocks with @verifly/api-client`.

## Phase 11 — Security & production hardening

### 11.1 — CORS

- [ ] Create `src/middleware/cors.ts` using Hono's `cors`. Allowed origins are driven by `env.ALLOWED_ORIGINS` (comma-separated). Dev: all 5 `http://localhost:<port>`. Prod: all 5 prod hostnames.
- [ ] `credentials: true`, `allowHeaders: ["Content-Type", "X-CSRF-Token", "X-Request-ID"]`, `exposeHeaders: ["X-Request-ID"]`.
- [ ] Verify: a cross-origin request from each portal's dev URL succeeds with cookies.

### 11.2 — Security headers

- [ ] Middleware setting: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: ...`.
- [ ] Content-Security-Policy for any HTML responses (the `/` root if you keep one); API responses are JSON so CSP is mostly N/A.

### 11.3 — Secrets & env vars

- [ ] Define required env: `JWT_SECRET` (unused here but reserve), `SESSION_PEPPER` (extra input to password hash — rotate strategy documented), `ALLOWED_ORIGINS`, `APP_ENV` (`dev`/`prod`), `COOKIE_DOMAIN`.
- [ ] Store via `bunx wrangler secret put <NAME> --env <dev|prod>`.
- [ ] Add a startup assertion: on first request, validate all required env vars are present; fail loudly otherwise.

### 11.4 — Email sending

- [ ] Pick a provider (Resend/Postmark). Add API key as a Wrangler secret.
- [ ] Create `src/services/email.ts` with `sendEmail({ to, template, data })` and templates: `verify-email`, `password-reset`, `verification-decision`, `application-decision`.
- [ ] Replace the `console.log` stubs in Phase 5 with real sends.
- [ ] Background via `c.executionCtx.waitUntil(...)` so the HTTP response isn't blocked.

### 11.5 — Input hardening

- [ ] All Zod schemas: `.strict()` on objects, explicit length caps on strings (email ≤254, name ≤100, free text ≤2000).
- [ ] Enforce max request body size (1 MB for JSON, 25 MB for document completion webhook) via a middleware.
- [ ] Reject unexpected content types.

### 11.6 — Audit completeness

- [ ] Code review: every state-changing service writes an `audit_log` row.
- [ ] Add a test that iterates the route table and fails if a non-GET route lacks an audit call.

### 11.7 — Legal/compliance basics

- [ ] Document data retention policy in `docs/data-retention.md` (soft-deleted users purged after 90 days, audit log retained 2 years).
- [ ] Add `DELETE /users/me` cron job (Phase 14) that purges old soft deletes.

- [ ] Commit: `chore(api): security hardening + real email + audit completeness`.

## Phase 12 — Observability

- [ ] Enable Cloudflare Workers Logs (`observability` block in `wrangler.jsonc`, already set Phase 1).
- [ ] Add structured logging to every route: one log at request start, one at end.
- [ ] Add an `/internal/metrics` endpoint (admin-only) that aggregates from D1: requests/day, error rate, median latency (requires a `request_metrics` table, Phase 12.1).
- [ ] 12.1 Create `schema/request_metrics.ts` — captures per-request duration, status, route; insert async via `waitUntil`.
- [ ] Wire Sentry (or equivalent) for unhandled exceptions — `@sentry/cloudflare`.
- [ ] Add uptime monitor (Cloudflare Health Checks or an external pinger) hitting `/health`.
- [ ] Commit: `feat(api): observability + error monitoring`.

## Phase 13 — Testing

- [ ] Configure `vitest.config.ts` with `@cloudflare/vitest-pool-workers` so tests run in the Workers runtime.
- [ ] `tests/unit/` — services, password hashing, state machine, presigning math.
- [ ] `tests/integration/` — spin up a miniflare instance, run the full route table against an ephemeral D1:
  - Auth flows (register/login/logout/reset/change).
  - RBAC matrix — for each route × role, assert pass/fail as expected.
  - State machine — every allowed and disallowed transition.
  - Rate limiting triggers at the expected threshold.
  - CSRF rejects when header missing.
- [ ] `tests/e2e/` (optional) — drive one frontend app against a locally-running API with Playwright, golden path only.
- [ ] Target: 80%+ line coverage in services, 100% in auth + state machine.
- [ ] Add `bun run test`, `test:watch`, `test:coverage` scripts.
- [ ] Add a pre-commit hook running `test` + `typecheck` + `lint` on changed packages.
- [ ] Commit: `test(api): unit + integration coverage for auth, RBAC, state machine`.

## Phase 14 — CI/CD

- [ ] Create `.github/workflows/api-ci.yml`:
  - Triggers on PRs touching `apps/api/**`, `packages/types/**`, `packages/api-client/**`.
  - Steps: install, typecheck, lint, test, `wrangler deploy --dry-run`.
- [ ] Create `.github/workflows/api-deploy.yml`:
  - On merge to `main`, deploy to `dev` env automatically.
  - On tag `api-v*`, deploy to `prod`.
- [ ] Store `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repo secrets.
- [ ] Add a **manual approval** gate before prod deploy.
- [ ] Scheduled cron worker (`wrangler.jsonc` `triggers.crons`):
  - Daily 02:00 UTC — hard-delete soft-deleted users older than 90 days, expire old sessions, prune `request_metrics` older than 30 days.
- [ ] Commit: `ci(api): CI + deploy workflows`.

## Phase 15 — End-to-end verification & ship

Do not merge to `main` until all pass:

- [ ] `bun install` at root: clean.
- [ ] `bun run build` in all 5 apps: clean.
- [ ] `bun run typecheck` + `lint` + `test` in `apps/api`: clean.
- [ ] `bunx wrangler deploy --dry-run` in `apps/api`: clean.
- [ ] D1 migrations apply cleanly to a fresh dev DB.
- [ ] Golden-path manual test on dev environment, one full cycle per portal:
  - [ ] Student: register → login → create application → upload document → initiate verification → see status update.
  - [ ] University: login → see new application → move through state machine → issue decision.
  - [ ] Bank: login → see verification → review docs → issue decision.
  - [ ] Counselor: login → see their students' progress.
  - [ ] Admin: login → see platform dashboard → review audit log.
- [ ] Load test: `k6 run scripts/load-test.js` sustains 200 rps for 5 min with p95 < 400 ms and error rate < 0.5%.
- [ ] Security review: run a basic OWASP checklist (auth, authorization, injection, XSS via document metadata, CSRF, rate limiting, IDOR on every `:id` route).
- [ ] Tag the repo `api-v1.0.0` and deploy to prod.
- [ ] Update `learningguide.md` with the final architecture and decisions.
- [ ] Update the root `README.md` with API overview, local dev instructions, and deploy steps.

---

## Out of scope (follow-ups)

- WebSocket/realtime updates (students watching verification status). Add a Durable Object in a later iteration.
- Payment integration (Stripe) — separate track.
- Admin impersonation / "login as user" — deliberately deferred; requires extra audit rigor.
- Multi-tenant isolation beyond role scoping (dedicated schema per university) — not needed at current scale.
- Full PII encryption at rest beyond D1 defaults — revisit when legal review happens.

---

## Dependency graph (quick reference)

```
0 Pre-flight
  └─ 1 Scaffold api
      └─ 2 D1 provisioning
          └─ 3 Schema + migrations
              └─ 4 Core infra (middleware, errors, validation)
                  └─ 4.1 Platform abstraction (Ctx + ports + adapters)
                  └─ 5 Auth (depends on 3, 4, 4.1)
                      └─ 6 API client package (types locked)
                          └─ 7 Domain APIs (depends on 4, 5, 6)
                              ├─ 8 R2 storage (parallelizable with 7.1–7.5)
                              └─ 9 Portal aggregates (after 7)
                                  └─ 10 Frontend integration (per app, sequential)
                                      └─ 11 Security hardening
                                          └─ 12 Observability
                                              └─ 13 Testing
                                                  └─ 14 CI/CD
                                                      └─ 15 Ship
```
