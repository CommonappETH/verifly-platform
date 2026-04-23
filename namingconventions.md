# Verifly — Naming Conventions

**Status:** Enforced. Violations are a review block, not a style suggestion.
**Scope:** All code in this monorepo (`apps/*`, `packages/*`) and all database, API, and deployment artifacts produced by it.
**Stack context:** TypeScript, Bun, Hono (API), Drizzle ORM (SQLite locally, Postgres on AWS), Zod (validation), React + TanStack (frontends), `@verifly/*` scoped workspace packages.

This document is strict and opinionated on purpose. Consistency is more valuable than personal preference; a new contributor should be able to predict every name in the codebase without reading the surrounding code.

---

## 1. Files and folders

### 1.1 Directories

- **Rule:** `kebab-case`. No `camelCase`, no `PascalCase`, no spaces, no leading/trailing hyphens.
- **Why:** Case-insensitive filesystems (macOS default, Windows) treat `UserProfile` and `userprofile` as the same directory, which silently breaks on case-sensitive Linux (CI, Lambda, containers).

| Good | Bad |
|---|---|
| `src/routes/applications/` | `src/routes/Applications/` |
| `packages/api-client/` | `packages/apiClient/` |
| `apps/api/src/services/application-state/` | `apps/api/src/services/applicationState/` |

### 1.2 TypeScript source files

- **Rule:** `kebab-case.ts` for modules. One concept per file; the file name states the concept.
- **Never:** `utils.ts`, `helpers.ts`, `misc.ts`, `index-new.ts`, `types.ts` as a catch-all.

| Good | Bad |
|---|---|
| `apps/api/src/services/application-state.ts` | `apps/api/src/services/applicationState.ts` |
| `apps/api/src/middleware/rate-limit.ts` | `apps/api/src/middleware/rateLimiter.ts` |
| `apps/api/src/lib/crypto/password.ts` | `apps/api/src/lib/crypto/passwordUtils.ts` |

### 1.3 React components and hooks

- **Components:** `PascalCase.tsx`, one component per file; the file name is exactly the exported component name.
- **Hooks:** `use-<thing>.ts` on disk (kebab-case file) exporting `use<Thing>` (camelCase symbol). Kebab-case on disk keeps layout uniform; the symbol follows React's `use` convention.

| Good | Bad |
|---|---|
| `apps/student/src/components/AppShell.tsx` exporting `AppShell` | `apps/student/src/components/appshell.tsx` |
| `apps/admin/src/hooks/use-current-user.ts` exporting `useCurrentUser` | `apps/admin/src/hooks/UseCurrentUser.ts` |

### 1.4 Test files

- **Rule:** Colocated with the source file they test. File name = source name + `.test.ts` (or `.test.tsx`). No `__tests__/` folders, no `.spec.ts` suffix.

| Good | Bad |
|---|---|
| `password.ts` → `password.test.ts` | `password.ts` → `test-password.ts` |
| `components/AppShell.tsx` → `components/AppShell.test.tsx` | `__tests__/appShell.spec.ts` |

### 1.5 Drizzle schema files

- **Rule:** One file per table. File name = table name in `snake_case` + `.ts`. The file exports the Drizzle table under the `camelCase` form of the same name.

| Disk path | Exports |
|---|---|
| `apps/api/src/db/schema/users.ts` | `export const users = sqliteTable("users", { ... })` |
| `apps/api/src/db/schema/password_resets.ts` | `export const passwordResets = sqliteTable("password_resets", { ... })` |
| `apps/api/src/db/schema/university_users.ts` | `export const universityUsers = sqliteTable("university_users", { ... })` |

### 1.6 Reserved file names

- `index.ts` — **only** for barrel re-exports. An `index.ts` that contains logic is a code smell; extract the logic to a named file and re-export it from `index.ts`.
- `types.ts` — permitted only inside a `src/types/` subdirectory with multiple entity-specific files (`types/user.ts`, `types/student.ts`). A top-level `types.ts` dumping ground is banned.
- `constants.ts` — permitted as a package-wide barrel; individual concepts still live in named files (`password.ts` exports `PASSWORD_MIN_LEN`, not a shared `constants.ts`).

### 1.7 Workspace package names

- **Rule:** `@verifly/<kebab-case>`, all lowercase, no version in the name.

| Good | Bad |
|---|---|
| `@verifly/api`, `@verifly/api-client`, `@verifly/ui`, `@verifly/types` | `@verifly/API`, `@verifly/apiClient`, `@verifly/api-v2` |

---

## 2. Variables, functions, classes

### 2.1 Variables and function arguments

- **Rule:** `camelCase`. No underscore prefix for "private" — rely on module exports. No Hungarian notation (`strName`, `intCount`).

| Good | Bad |
|---|---|
| `const userId = ctx.user.id` | `const user_id = ctx.user.id` |
| `function createStudent(input: CreateStudentInput)` | `function CreateStudent(Input: CreateStudentInput)` |

### 2.2 Booleans

- **Rule:** Prefix with `is`, `has`, `can`, `should`, or `was`. A boolean reads like a question.

| Good | Bad |
|---|---|
| `isActive`, `hasVerifiedEmail`, `canEdit`, `shouldRetry` | `active`, `verified`, `edit`, `retry` |
| `const wasDeleted = user.deletedAt !== null` | `const deleted = user.deletedAt !== null` |

### 2.3 Functions

- **Rule:** `camelCase`, verb-first. Pure functions start with the action; side-effectful functions make the side effect visible in the name.
- **Async:** Do not prefix with `async` or suffix with `Async`. The signature already says so.

| Good | Bad |
|---|---|
| `getUserById(id)` | `userById(id)` |
| `sendVerificationEmail(user)` | `verificationEmail(user)` |
| `async function fetchStudents()` | `async function asyncFetchStudents()` |

Preferred verbs:

- **Read:** `get` (throws/404 if missing), `find` (returns `null` if missing), `list`, `search`.
- **Write:** `create`, `update`, `delete`, `upsert`.
- **Transition:** `submit`, `approve`, `reject`, `cancel`.
- **Compute:** `build`, `format`, `parse`, `normalize`, `calculate`.
- **Check:** `is`, `has`, `can` for predicates; `assert` / `require` for throwing variants.

### 2.4 Classes

- **Rule:** `PascalCase`. Used sparingly; prefer functions + types. Classes are reserved for error hierarchies and cases where a stable `instanceof` check carries meaning.
- Error classes **must** be suffixed with `Error`.

| Good | Bad |
|---|---|
| `class AppError extends Error` | `class appError extends Error` |
| `class NotFoundError extends AppError` | `class NotFound extends AppError` |

### 2.5 Constants

- **Rule:** `SCREAMING_SNAKE_CASE` for compile-time-known primitive constants. `camelCase` for everything else (config objects, computed values).

| Good | Bad |
|---|---|
| `const PASSWORD_MIN_LEN = 12` | `const passwordMinLen = 12` |
| `const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30` | `const SessionTtlSeconds = 60 * 60 * 24 * 30` |
| `const defaultConfig = { timeout: 5000 }` | `const DEFAULT_CONFIG = { timeout: 5000 }` |

### 2.6 Types and interfaces

- **Rule:** `PascalCase`. Prefer `type` over `interface`; use `interface` only when you need declaration merging (augmenting external libs) or `extends` chains across files.
- No `I`-prefix (`IUser`). No `T`-suffix on type aliases.

| Good | Bad |
|---|---|
| `type User = { id: string; email: string }` | `interface IUser { ... }` |
| `type CreateStudentInput = z.infer<typeof createStudentSchema>` | `type TCreateStudentInput = ...` |

### 2.7 Enum-like string unions

- **Rule:** Never use TypeScript `enum`. Use a `const` tuple plus a union type derived from it.
- Literal values are `snake_case` when they map to DB column values (matching Zod and `CHECK` constraints), `camelCase` only when purely client-side.

```ts
// Good
export const userRoles = ["admin", "student", "counselor", "bank", "university"] as const;
export type UserRole = (typeof userRoles)[number];

// Bad
export enum UserRole { Admin = "admin", Student = "student" }
```

### 2.8 React components

- **Rule:** `PascalCase` symbol. Props type is `<ComponentName>Props`.

```tsx
// Good
type StudentCardProps = { student: Student; onSelect: (id: string) => void };
export function StudentCard({ student, onSelect }: StudentCardProps) { ... }

// Bad
interface IStudentCardProps { ... }
export const studentCard = (...) => ...;
```

### 2.9 React event handlers

- **Rule:** Prop side is `on<Event>`; implementation side is `handle<Event>`.

```tsx
// Good
<Button onClick={handleSubmit} />
function handleSubmit() { ... }

// Bad
<Button onClick={onSubmit} />
function onSubmit() { ... }     // name-collides with the prop
```

---

## 3. API routes and DTOs

### 3.1 URL paths

- **Rule:** `kebab-case`, plural nouns for collections, nested for ownership.

| Good | Bad |
|---|---|
| `GET /students` | `GET /Student` |
| `GET /students/:id/guardians` | `GET /getStudentGuardians?id=...` |
| `POST /verifications/:id/submit` | `POST /verificationSubmit?id=...` |

### 3.2 Path and query parameters

- **Rule:** `camelCase`, matching the TypeScript variable that reads them.

| Good | Bad |
|---|---|
| `GET /students/:id/guardians/:guardianId` | `GET /students/:student_id/guardians/:guardian_id` |
| `GET /applications?status=submitted&cursor=...&limit=20` | `GET /applications?Status=...&Cursor=...` |

### 3.3 HTTP verbs

- `GET` — safe, idempotent read.
- `POST` — create, or an action on a resource where `PATCH` would be semantically wrong (`POST /verifications/:id/submit`).
- `PATCH` — partial update of an existing resource.
- `PUT` — full replacement; rare here, avoid unless semantics truly are "replace."
- `DELETE` — delete. Soft by default (sets `deleted_at`); a hard-delete admin route is separate.

### 3.4 JSON bodies and responses

- **Rule:** All request and response JSON uses `camelCase` keys. The wire shape matches the TypeScript type exactly — Drizzle handles the DB `snake_case` ↔ TS `camelCase` mapping; the API boundary does not transform.

```ts
// Good
{ "firstName": "Alex", "createdAt": 1713800000000, "isActive": true }

// Bad
{ "first_name": "Alex", "created_at": "2026-04-23T00:00:00Z", "is_active": 1 }
```

### 3.5 DTOs and Zod schemas

- **Schema symbol:** `<action><Entity>Schema` in `camelCase`.
- **Input type:** `<Action><Entity>Input` in `PascalCase`, inferred via `z.infer`.
- **Output type:** `<Entity>Response` in `PascalCase` — no `Output` or `Dto` suffix.

```ts
// Good
export const createStudentSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  countryCode: z.string().length(2),
}).strict();
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type StudentResponse = { id: string; firstName: string; lastName: string };

// Bad
export const CreateStudentSchema = z.object({ ... });     // PascalCase schema
export const createStudentDto = z.object({ ... });        // vague suffix
export type CreateStudentType = z.infer<typeof ...>;      // redundant suffix
```

### 3.6 Error response shape

- **Rule:** Every error response uses the exact shape below. Error codes are `snake_case`. Status codes follow HTTP semantics.

```json
{ "error": { "code": "not_found", "message": "Student not found", "details": {} }, "requestId": "req_7k3qw..." }
```

Error codes currently defined: `validation_failed`, `not_found`, `unauthorized`, `forbidden`, `conflict`, `invalid_transition`, `rate_limited`, `internal_error`. New codes are added in `apps/api/src/lib/errors.ts` and documented in the API reference in the same PR.

### 3.7 Pagination

- **Rule:** Cursor-based, not offset-based. Query keys: `cursor`, `limit`. Response wrapper:

```ts
{ "items": [...], "nextCursor": "opaque-string-or-null", "hasMore": true }
```

---

## 4. Database tables and columns

### 4.1 Tables

- **Rule:** `snake_case`, plural. A row represents one of many; the table is the set.

| Good | Bad |
|---|---|
| `users`, `applications`, `password_resets`, `university_users` | `User`, `application`, `PasswordReset`, `universityUser` |

### 4.2 Columns

- **Rule:** `snake_case`. Never abbreviate (`description`, not `desc`). The only accepted abbreviations are universally-understood three-letter codes (`gpa`, `url`, `ip`, `utc`).

| Good | Bad |
|---|---|
| `created_at`, `user_id`, `password_hash`, `is_active` | `createdAt`, `userId`, `passwordHash`, `isActive` |
| `description`, `country_code` | `desc`, `cntry` |

### 4.3 Primary keys

- **Rule:** Every table has `id` as PK. Type is `text`, value is a `nanoid` generated in the service layer. No `uuid` defaults, no `autoincrement`.
- **Why:** Portable across SQLite and Postgres (`learningguide.md` §13 SQLite ∩ Postgres rule); URL-safe; sortable-enough by `created_at`; no DB extension required.

### 4.4 Foreign keys

- **Rule:** `<referenced_table_singular>_id`. Always declare the FK relationship with an explicit `ON DELETE` (`cascade` or `restrict`, never left implicit).

| Good | Bad |
|---|---|
| `user_id` referencing `users.id` | `users_id`, `userid`, `owner` |
| `student_id` referencing `students.id` | `studentFk`, `parent_id` |

### 4.5 Timestamps

- **Rule:** `created_at`, `updated_at`, `deleted_at` (nullable). Type is `integer` storing Unix **milliseconds** (not seconds, not ISO strings). Timezone is always UTC.
- **Why:** Unified integer type across SQLite and Postgres; no timezone ambiguity; fast to index and compare.

### 4.6 Booleans

- **Rule:** Stored as `integer` (0/1) with `CHECK(column IN (0, 1))`. Column name prefixed with `is_`, `has_`, `can_`, `was_`, matching §2.2.

| Good | Bad |
|---|---|
| `is_active integer not null check (is_active in (0, 1))` | `active boolean` (Postgres-only) |
| `has_verified_email` | `verified_email_flag`, `email_verified` |

### 4.7 Enum-like columns

- **Rule:** `text not null` + explicit `CHECK(column IN ('a', 'b', ...))`. Values are `snake_case` string literals matching the Zod union in the service layer (see §2.7).

```ts
// schema/applications.ts
status: text("status", { enum: applicationStatuses }).notNull()
```

### 4.8 Indexes

- **Rule:** Index name = `idx_<table>_<columns>`. Unique index = `uq_<table>_<columns>`. Columns are joined with `_` in the order they appear in the index.

| Good | Bad |
|---|---|
| `idx_applications_student_id`, `idx_applications_university_id_status` | `applicationsByStudent`, `idx1` |
| `uq_users_email` | `users_email_unique` |

### 4.9 Structured-blob columns

- **Rule:** **Banned in the primary schema** for portability (`learningguide.md` §13). If structured data must live in one column, store it as `text` and parse/validate with Zod at the service boundary. Add an in-schema comment explaining why it isn't relational.

---

## 5. Environment variables

### 5.1 Naming

- **Rule:** `SCREAMING_SNAKE_CASE`. Most-specific word first (`DATABASE_URL`, not `URL_DATABASE`).

| Good | Bad |
|---|---|
| `DATABASE_URL`, `SESSION_PEPPER`, `ALLOWED_ORIGINS` | `databaseUrl`, `sessionPepper`, `allowed-origins` |
| `COOKIE_DOMAIN`, `APP_ENV` | `COOKIEDOMAIN`, `env` |

### 5.2 Required vs optional

- **Rule:** Every env var the app reads is declared in a Zod schema in `apps/api/src/platform/local/secrets.ts`. The app fails to boot (`process.exit(1)`) if a required var is missing or malformed.
- `.env.example` mirrors the Zod schema's keys exactly. A missing example key is a PR block.

### 5.3 Scoping prefixes

- **Backend (`apps/api`):** No prefix — `DATABASE_URL`, `PORT`, `SESSION_PEPPER`.
- **Frontends (`apps/*` with Vite):** Must use `VITE_` prefix to be exposed to client bundles — `VITE_API_BASE_URL`. Anything without `VITE_` stays server-side / build-time only.
- **Secrets never carry the `VITE_` prefix.** A `VITE_*` value ends up in the browser bundle.

| Good | Bad |
|---|---|
| `VITE_API_BASE_URL=http://localhost:8787` (client-visible, not secret) | `API_BASE_URL=...` (invisible to client; frontend breaks) |
| `SESSION_PEPPER=<random>` on server only | `VITE_SESSION_PEPPER=...` (leaks to browser) |

### 5.4 Values

- **Rule:** `APP_ENV` is one of `dev`, `test`, `prod` — no other values. `PORT` is an integer. Booleans are the strings `"true"` / `"false"`, Zod-coerced at parse time.
- **Never:** Commit `.env` or any file containing a real secret. Only `.env.example` (with placeholder values) is tracked.

---

## 6. Enforcement

- TypeScript + `@verifly/config/tsconfig.base.json` `strict: true` catches most type-naming mismatches at compile time.
- ESLint enforces file casing (`unicorn/filename-case`), identifier casing (`@typescript-eslint/naming-convention`), and the Phase 4.1 platform-adapter import isolation rule.
- Drizzle schema review catches column/table deviations before they enter a migration.
- PR review is the backstop: any violation of this document is a change request regardless of size.

---

## 7. When to update this document

Add a new rule here **before** adopting a new pattern in code, not after. "We do this in one place, let's codify it" comes after the second occurrence, not the first. If a rule here no longer matches the codebase, the document is wrong and must be updated in the same PR that changes the code — never leave drift.
