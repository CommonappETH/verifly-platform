# Verifly Monorepo — Learning Guide

Reference for how the Verifly monorepo is organized, why the cleanup refactor exists, and the conventions every contributor should follow. Pair this with `checklist.md` (the execution steps) and the plan at `/Users/samim/.claude/plans/i-have-a-verifly-wild-riddle.md`.

---

## 1. Why this refactor exists

Before the refactor, every portal app under `apps/` carried its own copy of:

- The 50 shadcn/ui primitives (byte-identical across all five apps).
- The `cn()` class-name helper (byte-identical).
- Overlapping composite components (`StatusBadge`, `EmptyState`, `KpiCard` / `StatCard`) with small, accidental divergences.
- The same tsconfig, eslint config, vite config, bunfig, components.json, and a near-identical `package.json`.
- Overlapping domain types with **drift**: for example, `ApplicationStatus` uses kebab-case in `apps/university` (`"under-review"`) and snake_case in `apps/student` / `apps/admin` (`"under_review"`). The same entity is modeled as `Student` (bank), `StudentProfile` (student), and `Applicant` (university).

Duplication cost:

- Every shadcn upgrade is 5 changes instead of 1.
- Bug fixes in one composite component don't propagate.
- Type drift silently breaks cross-portal contracts (e.g. backend sends `under_review`, university portal expects `under-review`).
- A latent deploy bug: every `wrangler.jsonc` has `"name": "tanstack-start-app"`, so the apps would overwrite each other on deploy.

The refactor introduces four shared packages — `@verifly/ui`, `@verifly/types`, `@verifly/utils`, `@verifly/config` — to make duplication structurally impossible and unify the drift.

---

## 2. Workspace topology

After the refactor:

```
verifly-platform/
├── apps/                    # Portal apps (thin, mostly routes + app-specific views)
│   ├── admin/               # Platform-wide operations
│   ├── bank/                # Bank-side verification workflows
│   ├── counselor/           # School counselor portal
│   ├── student/             # Student-facing portal
│   └── university/          # University admissions/verification
├── packages/                # Shared libraries (workspace-resolved)
│   ├── ui/                  # @verifly/ui     — shadcn primitives + composed components
│   ├── types/               # @verifly/types  — domain types/enums (types-only, no runtime)
│   ├── utils/               # @verifly/utils  — framework-agnostic helpers (cn, formatters, mask)
│   └── config/              # @verifly/config — tsconfig / eslint / vite / shadcn presets
├── package.json             # Workspaces root; hoists shared deps
└── bun.lockb                # Single lockfile; per-app lockfiles are removed
```

Apps are thin: routes, layouts, app-specific feature modules, mock data, and anything wired to a specific portal's business flows. Everything reusable lives in `packages/`.

---

## 3. Package responsibilities

| Package            | Contains                                                                 | Does NOT contain                                              |
| ------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `@verifly/ui`      | shadcn primitives; presentational composites (StatusBadge, EmptyState, StatCard) | Data fetching, business logic, routing, auth, portal layouts  |
| `@verifly/types`   | Domain enums (`*Status`, `UserRole`); entity interfaces (`Student`, `Application`, `Verification`, `Document`) | Any runtime code; app-specific shapes; mock data               |
| `@verifly/utils`   | `cn()`, formatters (date/currency/relative), `daysUntil`, `initials`, `maskAccount` | React components; app-specific state; API client code         |
| `@verifly/config`  | `tsconfig.base.json`, `eslint-preset.js`, `components.base.json`, vite preset | Per-app path aliases, per-app wrangler names                  |

Rule of thumb: if it imports `react`, it belongs in `@verifly/ui`. If it's pure types, `@verifly/types`. If it's a runtime helper with no React, `@verifly/utils`. If it's tooling, `@verifly/config`.

---

## 4. Import rules

- **Always import from the package name**: `import { Button } from "@verifly/ui"`.
- **Never reach into another package's `src/`**: no `import … from "../../packages/ui/src/components/ui/button"`.
- **Allowed import directions**:
  - `apps/*` → any `@verifly/*` package.
  - `@verifly/ui` → `@verifly/types`, `@verifly/utils`.
  - `@verifly/utils` → `@verifly/types`.
  - `@verifly/types` → nothing (it's a leaf).
  - `packages/*` must **never** import from `apps/*`.
- **Path alias `@/*`** remains per-app and maps to `./src/*`. It is NOT used to reach across apps or into packages.

---

## 5. Adding a new shadcn component

After the refactor, shadcn lives in `packages/ui`. To add a new primitive:

1. From `packages/ui/`, run `npx shadcn@latest add <component>`. The generator writes into `packages/ui/src/components/ui/`.
2. Add an export for it in `packages/ui/src/index.ts`.
3. Consume it in any app via `import { X } from "@verifly/ui"`.

Do **not** run `npx shadcn add` inside an individual app. If you do, revert the change and re-add in `packages/ui`.

---

## 6. Enum casing convention

**Snake_case is canonical** for all enum string values (`"under_review"`, `"in_progress"`, `"approved"`, etc.). Rationale:

- Matches backend API payloads.
- `apps/student` and `apps/admin` already used snake_case — the drift was isolated to `apps/university`.
- Lowercase with underscores is unambiguous across JSON, URLs, and TypeScript string-literal types.

Migration notes:

- `apps/university` previously used kebab-case (`"under-review"`). All such values were converted to snake_case during step 5 of the refactor. Any downstream consumer (dashboards, saved queries) that still sends kebab-case needs to be updated in lock-step.
- Do not introduce a compatibility shim that accepts both forms — it hides the real drift.

---

## 7. Entity naming convention

One concept, one type:

| Canonical type       | Retired aliases                            | Notes                                                                 |
| -------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| `Student`            | `StudentProfile`, `Applicant`              | Admissions-specific fields are optional on `Student`, or live on a separate `Admission` type that references a `Student`. |
| `Application`        | —                                          | Shared across student, admin, university.                              |
| `Verification`       | `VerificationRequest`, `FinancialVerification` | Use a discriminated union on `kind` if verification type matters.  |
| `Document`           | —                                          | `DocumentKind` enum lives in `@verifly/types`.                         |
| `UserRole`           | Ad-hoc per-app unions                      | Single union type in `@verifly/types`.                                 |

If a new concept emerges that genuinely isn't a `Student` (e.g., `Parent`, `BankOfficer`), add a new type — don't reuse `Student` with a role flag.

---

## 8. Deploy gotcha — unique `wrangler.jsonc` names

Before the refactor, every `apps/*/wrangler.jsonc` had `"name": "tanstack-start-app"`. On Cloudflare, the `name` field is the Worker identity; deploying all five apps would overwrite the same Worker.

After the refactor, each app uses a unique name:

- `apps/admin` → `verifly-admin`
- `apps/bank` → `verifly-bank`
- `apps/counselor` → `verifly-counselor`
- `apps/student` → `verifly-student`
- `apps/university` → `verifly-university`

If you add a new app, pick a new unique name following the `verifly-<portal>` pattern.

---

## 9. When to add a new package

Decision tree:

1. **Is it React-specific and presentational?** → `@verifly/ui` (as a new export in `src/components/composed/` or a new primitive in `src/components/ui/`).
2. **Is it a TypeScript type or enum used by 2+ apps?** → `@verifly/types`.
3. **Is it a runtime helper with no React and no app state?** → `@verifly/utils`.
4. **Is it tooling config (tsconfig, eslint, build, lint)?** → `@verifly/config`.
5. **Is it app-specific?** → keep it in the app. Do not preemptively extract "in case" another app needs it.

Create a brand-new package only when:

- The concept doesn't fit any existing package (e.g. a future `@verifly/api` for a shared API client).
- Three or more apps would consume it.
- The surface area is big enough to justify a separate unit of versioning, testing, and documentation.

---

## 9a. Composite components — the `tone` contract

After step 4 of the refactor, the three composite components live at `packages/ui/src/components/composed/` and expose a deliberately small surface so apps can drive them from their own status vocabularies.

### What was done

Three components — `StatusBadge`, `EmptyState`, `StatCard` (née `KpiCard`) — previously existed in slightly different shapes across 4–5 apps. They were consolidated behind a single API per component, imported as `import { StatusBadge, EmptyState, StatCard } from "@verifly/ui"`.

### Why it was done

Before consolidation:

- `StatusBadge` existed in 4 apps with 4 different prop shapes (typed enum vs `string`, inline style maps vs `variant` prop, admin had hardcoded role/tenant colors buried in the component).
- `EmptyState` existed in admin (with a `hint` prop) and student (with a `description` prop) — same idea, different names.
- `KpiCard` (admin) and `StatCard` (university) told the same visual story with different prop names.

Each drift was small enough to ignore individually and big enough in aggregate that touching one meant reviewing all four. Consolidating removes the accidental polymorphism and gives every portal the same vocabulary.

### How the tone contract works

The shared `StatusBadge` takes **no app-specific status strings**. Its API is:

```ts
type StatusBadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "info"
  | "destructive"
  | "accent";

interface StatusBadgeProps {
  label: string;
  tone?: StatusBadgeTone;
  size?: "sm" | "md";
  className?: string;
}
```

Each app owns the translation from its own status vocabulary to `{ label, tone }`. In admin/bank/counselor that translation lives in `apps/<portal>/src/lib/status-badge.ts`:

```ts
// apps/admin/src/lib/status-badge.ts
export function statusBadgeProps(status: string): { label: string; tone: StatusBadgeTone } {
  // ...
}
```

Call sites look like `<StatusBadge {...statusBadgeProps(a.status)} />`.

Student is an exception: `apps/student/src/components/StatusBadge.tsx` is kept as a ~30-line adapter that forwards `label`/`variant`/`size` to the shared component, mapping `muted` → `neutral`. Student's call sites (30+) drive `variant` from inline data maps, so the adapter avoids a mechanical touch-every-route refactor while keeping the duplicate *implementation* out of the app.

### Key concepts

- **Presentational vs semantic**: the shared component cares about *tone* (how does it look), not *status* (what does it mean). Status is a domain concept and belongs in the app or in `@verifly/types`; tone is a visual concept and belongs in `@verifly/ui`.
- **Per-app translation layer**: the `statusBadgeProps()` helper (or the student adapter) is the one place each app names its own statuses. If a backend renames `"under_review"` to something else, only that helper changes — no component edits.
- **Inverse of "prop explosion"**: we did not teach `StatusBadge` every status every portal could ever hold. That's how the old admin version ended up with tenant-role colors living inside a generic badge.

### Best practices

1. When adding a new status to a portal, extend that portal's `statusBadgeProps()` map — do not add it to the shared component.
2. If two portals keep duplicating the same tone for the same logical status (e.g. both mapping `"approved"` → `success`), that's a signal the status belongs in `@verifly/types` with a shared tone resolver — but resist extracting on just one data point.
3. For `StatCard`, prefer `tone` (card background) or `iconClassName` (icon box background) — not both at once — to keep the visual hierarchy legible.
4. For `EmptyState`, `title` is required. Previous admin call sites that passed no title (`<EmptyState />`) now read `<EmptyState title="No results" />` explicitly — implicit defaults hide intent.

### Mistakes to avoid

- **Do not import composites from their source paths** (`@verifly/ui/src/components/composed/...`). Always import from the package root: `import { StatusBadge } from "@verifly/ui"`.
- **Do not restore app-specific strings to the shared component**. If you find yourself wanting to add a new `tone`, ask whether it's genuinely a new visual category or just a duplicate of an existing tone with a new name.
- **Do not reintroduce the inline `function StatCard()` or `function KpiCard()` pattern inside route files**. If a route needs a different layout, build it from `Card` + `CardContent` primitives directly — don't recreate a parallel StatCard.
- **Do not add a `variant` prop as an alias for `tone` on the shared component** to make migration cheaper. The one exception (student's adapter) is in the app, not in the package — it's explicitly a per-app translation layer, not a shared API.

---

## 9b. `packages/types` — shared enums and entity skeletons

After step 5 of the refactor, the cross-app type drift was consolidated into `@verifly/types`. This section documents the package contents and the patterns used to migrate each app.

### What was done

`packages/types/` exports:

- Enum unions (snake_case, see §6): `ApplicationStatus`, `VerificationStatus`, `DocumentStatus`, `UserRole`, `ApplicantType`, `DecisionStatus`.
- Entity skeletons: `User`, `Student`, `Guardian`, `Counselor`, `BankUser`, `Application`, `Verification`, `Document`, `DocumentKind`.

All entity skeletons use **optional** fields for anything not part of the identity, so portal apps can consume only the shape they need without TypeScript errors from missing extensions.

### Why it was done

- Before §5, `ApplicationStatus` used kebab-case in university (`"under-review"`) and snake_case everywhere else. The drift had already caused at least one silent bug class (university's badge display vs. backend status strings).
- `StudentProfile` (student), `Applicant` (university), and `Student` (bank/counselor) modeled overlapping concepts with different names; cross-portal code or future shared API clients couldn't speak one vocabulary.
- Without a shared type package, every change to a core enum had to be made five times, and nothing prevented the values from diverging again.

### How it works (simple explanation)

- **Enums are canonical unions**. Each app either imports the shared enum as-is or narrows with `Extract<SharedEnum, "a" | "b">` when the app's domain vocabulary is a strict subset. No app redeclares its own version of the same enum.
- **Entities are superset skeletons**. The canonical `Student` has every cross-app common field as optional; individual apps keep local "rich view" interfaces (e.g. university's local `Student` with `essays`, `activities`, `decision`) when their portal needs much more than the skeleton. Those local extensions live in each app's own `lib/types.ts` and are not re-exported upward.
- **Enum values stay canonical even when fields are optional**. Optional ≠ free-form string; a field typed `ApplicationStatus | undefined` still only accepts the 16 canonical snake_case values.

### Key concepts

1. **Superset types with optional fields** — lets one interface serve multiple portals without forcing every portal to carry every field.
2. **`Extract<UnionType, "value1" | "value2">`** — narrows a shared union to an app-specific subset while keeping the link to the canonical type. If the shared union ever loses a value, the narrow alias fails to compile — this is the point.
3. **Re-export for compatibility** — each app's local `types.ts` re-exports the shared enums (`export type { ApplicationStatus } from "@verifly/types"`) so existing imports from `@/lib/types` keep working. Migration is type-compatible without rewriting every import site.
4. **Retired alias names** — `StudentProfile` and `Applicant` are retired as *type names*. Runtime names like route segments (`/applicants`), UI strings ("Applicants"), and loader helpers (`getApplicant`) stay — they are portal vocabulary, not cross-app types.

### Best practices

1. **Never redeclare a shared enum locally**. If a portal needs a narrower set, use `Extract<>`; if it needs wider, the shared enum is the one that should grow.
2. **Keep app-specific view models in the app**. If a portal's `Student` type has 30 fields that only that portal uses, it belongs in the app, not in `@verifly/types`.
3. **Match the backend's casing**. Snake_case for enum values. Any new enum added to `@verifly/types` follows the same rule.
4. **When widening a shared type**, audit every app's usage first. Adding a value to `ApplicationStatus` is safe; changing an existing value's spelling is a cross-app migration.

### Mistakes to avoid

- **Do not import entity types from another app** (`import { Applicant } from "apps/university/..."`). Cross-portal shapes belong in `@verifly/types`; everything else stays local.
- **Do not re-introduce compatibility shims that accept both kebab-case and snake_case values**. The drift was deliberate to kill; accepting both hides new drift.
- **Do not define a type called `StudentProfile` or `Applicant` again**. Use `Student` (canonical) or a portal-specific name that clearly reads as a view model (e.g. `ApplicantDossier`, not `Applicant`).
- **Do not let `@verifly/utils` or `@verifly/ui` import from `apps/*`**. The import direction is one-way (apps → packages); violating it means a package can't be understood in isolation.

### Formatters and `maskAccount`

As part of §5, the framework-agnostic helpers (`formatDate`, `formatCurrency`, `formatDateTime`, `formatRelative`, `daysUntil`, `initials`, `maskAccount`) and the university-specific label/tone maps (`STATUS_LABEL` / `STATUS_TONE` / `VERIF_*` / `TYPE_TONE` / `DECISION_*`) moved to `@verifly/utils`. Each app's local `format.ts` / `api.ts` is now a thin re-export of `@verifly/utils`, preserving the existing `@/lib/format` and `@/lib/api` import paths.

The university tone/label maps still live in `@verifly/utils` (not `@verifly/ui`) because they return raw Tailwind class strings, not React nodes. They remain keyed by canonical enums, so if `@verifly/types` adds a new `ApplicationStatus` value the map gets a `Partial<Record<>>` gap rather than a compile error — letting apps ship new status values before picking a tone for them.

---

## 9c. Dep hoisting — one version, declared once

Step 6 of the refactor moved every shared third-party dependency from the five `apps/*/package.json` files into the root `package.json`. After the hoist, each app's manifest only declares workspace refs and scripts.

### What was done

- 51 runtime deps + 16 devDeps (identical across all 5 apps) were consolidated into the root `package.json`. Examples: `react`, `@radix-ui/*`, `@tanstack/*`, `lucide-react`, `zod`, `tailwindcss`, `vite`, `eslint`, `prettier`.
- Each `apps/*/package.json` was reduced to: `name`, `private`, `sideEffects`, `type`, `scripts`, and four workspace refs (`@verifly/types`, `@verifly/ui`, `@verifly/utils` in `dependencies`; `@verifly/config` in `devDependencies`). That's it.
- Five per-app `package-lock.json` files were deleted; the root `bun.lock` is now the sole lockfile.
- Student's stale `@lovable.dev/vite-tanstack-config` pin (`^1.3.0`) was unified to `^1.4.0` during the hoist — the only version drift across apps.
- Populated the root `README.md` (previously empty) with workspace layout, install/dev flow, import rules, and cross-references.

### Why it was done

- **One version of truth**. Before the hoist, bumping React (or any shared dep) meant editing five files; a mistake in one meant silent version drift.
- **Faster `bun install`**. Bun workspaces hoist shared deps to root `node_modules/`; deduping is free when every app points at the same version range.
- **Smaller diffs for upgrades**. Future `npm-check-updates` or Renovate runs touch only the root manifest.

### How the hoist works

Bun (and npm) workspaces traverse all `workspaces` entries and build a unified dep graph. A dep declared in the root `package.json` is physically installed at `<root>/node_modules/<dep>`. When an app file imports `react`, Node's module resolution walks up from `apps/admin/src/...` → `apps/admin/node_modules/` (empty) → `<root>/node_modules/react/` and resolves it. This is the standard hoisting pattern — no special config.

Workspace package deps (`@verifly/*`) stay per-app because they're symlinked, not hoisted. Removing them from the app manifest would make the link invisible to Bun's resolver.

### Key concepts

- **Hoisting**: Bun's term for "install this dep once at the top of the workspace tree". The app's `node_modules/` is empty of hoisted deps; resolution walks up.
- **Declared vs resolved**: declaring a dep in an app's `package.json` is a *contract* (the app needs this dep); resolving it is a *filesystem lookup* (Node finds the file). Hoisting separates the two.
- **Phantom deps risk**: an app can accidentally import a dep that's only declared in a sibling app, because hoisting makes it resolvable. After this refactor, every dep an app can reach is declared at the root — so there are no phantom deps, only declared-at-root deps.

### Best practices

1. When adding a third-party dep that 2+ apps will use, add it to root `package.json` — not to each app.
2. When a dep is genuinely app-specific (e.g., a portal-only integration SDK), declare it in that app's `package.json`. Do not pre-emptively hoist.
3. Bump dep versions at the root. After a bump, run `bun install` once and build all five apps.
4. The workspace packages (`packages/ui`, `packages/utils`, `packages/types`, `packages/config`) still declare their own runtime deps — they are independent units and ship their own dep graph.

### Mistakes to avoid

- **Do not re-add hoisted deps to `apps/*/package.json`** to "make imports explicit". Declaring the same dep in two places creates version-drift risk for zero clarity benefit.
- **Do not delete workspace refs from an app's `package.json`** thinking they'll be hoisted. `workspace:*` refs are the only way Bun knows to symlink the package; removing them breaks the build.
- **Do not hoist deps that only `packages/ui` (or another package) uses.** The package manages its own dep graph; apps get those transitively via the workspace link.
- **Do not keep per-app `package-lock.json` files alongside `bun.lock`.** Two lockfile formats disagreeing about resolved versions is a guaranteed source of "works on my machine" bugs.

---

## 10. Known follow-ups

Deferred on purpose; revisit once the consolidation is merged:

- **`@verifly/api`** — each portal currently has its own `src/lib/api.ts` or `src/lib/*-mock/` module. Once the backend contracts stabilize, consolidate the HTTP client, query keys, and response schemas into a shared package that consumes `@verifly/types`.
- **`@verifly/mocks`** — mock fixtures (`apps/admin/src/lib/admin-mock/`, `apps/bank/src/lib/mock-data.ts`, etc.) are currently per-app. If we end up wanting consistent mock personas across portals for dev/testing, extract into a shared package.
- **Shared layout primitives** — `AppShell`, `AppLayout`, `AppSidebar`, `TopBar` are currently per-app because they're tied to app-specific routes. If a common layout skeleton emerges (header slot + sidebar slot + content), consider a headless `AppShell` in `@verifly/ui` with per-app route configs injected as props.
- **`airules.md` and `namingconventions.md`** — currently empty. Populate them if/when the team wants a shorter contributor-facing summary of the conventions in this guide.

---

## 11. Backend Phase 0 — Pre-flight (2026-04-22)

Branch: `backend/phase-0-bootstrap`. Start of the `apps/api` build-out per `checklistBackend.md`.

### What

- Cut work branch from `main`.
- Verified baseline: `bun install` clean at root (988 packages); all 5 frontend apps (`admin`, `bank`, `counselor`, `student`, `university`) build cleanly with `bun run build`.
- Locked in three pre-flight decisions (below).

### Why

Phase 0 exists to guarantee we start the backend on a known-green tree and with irreversible infra choices (Cloudflare account topology, domain scheme) already made. Changing account topology mid-build means re-provisioning D1/R2/KV under new IDs; changing the domain means re-issuing cookies and CORS. Decide once, cheaply, before code.

### How — decisions recorded

**Wrangler usage.** Use `bunx wrangler` everywhere (no global install). Keeps the CLI version pinned in `apps/api/devDependencies` so every machine and CI runner uses the same Wrangler, avoiding drift between local dev and deploy.

**Cloudflare account topology.** One Cloudflare account, two Worker environments: `dev` and `prod`, declared inside a single `apps/api/wrangler.jsonc`. Worker names: `verifly-api-dev` (default) and `verifly-api-prod` (`env.prod`). Rationale: one billing surface, one DNS zone, one secrets store; environments separate data (distinct D1 DBs, R2 buckets, KV namespaces) without doubling account admin. Revisit only if prod isolation becomes a compliance requirement.

**API URL scheme.** `https://api.verifly.<domain>` (prod) and `https://api-dev.verifly.<domain>` (dev). Keeps the auth cookie `Domain=.verifly.<domain>` able to cover both the 5 portal subdomains and the API without cross-site cookie gymnastics.

### Open items (blocking Phase 1 readiness, not Phase 0 code)

- `wrangler login` — user runs interactively to confirm the Cloudflare account that owns the 5 existing frontend Workers.
- DNS/zone ownership for the final `verifly.<domain>` — required before Phase 11 wires CORS + custom domain. **Deferred (2026-04-22):** proceeding against `*.workers.dev`; Phase 11 is blocked until DNS is sorted.

---

## 12. Backend Phase 1 — Scaffold `apps/api` (2026-04-22)

### What

New workspace package `@verifly/api` added at `apps/api/`. Minimal Hono worker exposing `GET /health`, wired to `wrangler dev` on port 8787. Verified: typecheck clean, local boot returns `{"ok":true,"service":"verifly-api","version":"0.0.0"}`.

Files created:

- `apps/api/package.json` — runtime deps `hono`, `drizzle-orm`, `zod`, `@noble/hashes`, `nanoid`; dev deps `wrangler`, `drizzle-kit`, `@cloudflare/workers-types`, `@types/bun`, `typescript`, `vitest`, `@cloudflare/vitest-pool-workers`, `@verifly/config`.
- `apps/api/tsconfig.json` — extends `@verifly/config/tsconfig.base.json`, overrides `lib` to `["ES2022"]` and `types` to `["@cloudflare/workers-types", "@types/bun"]` to drop the DOM types the frontend config ships with.
- `apps/api/wrangler.jsonc` — worker name `verifly-api-dev` at top, `env.prod.name = "verifly-api-prod"`, `compatibility_date: "2026-04-22"`, `compatibility_flags: ["nodejs_compat"]`, `observability.enabled: true`, empty `d1_databases` / `r2_buckets` / `kv_namespaces` arrays (filled in Phases 2/5/8), `vars` seeded with `APP_ENV` and `VERSION`.
- `apps/api/src/index.ts` — Hono app, single `GET /health` route, default export `{ fetch: app.fetch }`.

### Why

**`@verifly/api` as a workspace package, not a standalone repo.** One monorepo, one lockfile — the API shares `@verifly/types` and (in Phase 6) `@verifly/api-client` with the 5 frontends without version drift. The frontends can import the same Zod schemas the server validates against, which is the whole point of putting the API in-repo.

**Cloudflare-typed tsconfig — no DOM.** The base config at `packages/config/tsconfig.base.json` includes `DOM` + `DOM.Iterable` in `lib` because every consumer so far has been a React app. The Workers runtime doesn't have `window` / `document`; including DOM types would let route handlers compile against APIs that crash at runtime. Explicitly overriding `lib: ["ES2022"]` and `types: ["@cloudflare/workers-types", "@types/bun"]` gives the Workers `fetch`/`Request`/`Response` types and nothing misleading.

**Empty binding arrays instead of omitted keys.** `wrangler.jsonc` declares `d1_databases: []`, `r2_buckets: []`, `kv_namespaces: []` up front (both at top level and under `env.prod`). Keeping the keys present means Phase 2/5/8 is a pure append — no schema-shape diffs muddying the commit.

**Dev-mode boot verification before any domain work.** `wrangler dev` runs the worker under Miniflare — a local emulator of the Workers runtime. Hitting `localhost:8787/health` and getting `ok: true` proves the Worker bundle compiles and the router dispatches correctly, without needing `wrangler login` or a real deploy. That lets Phase 1 finish fully offline.

### How

Phase 1 deliberately left the commit un-done. Next session should verify the diff and run `git commit -m "feat(api): scaffold @verifly/api worker with /health endpoint"`.

Next up — Phase 2 needs an authenticated `wrangler` (`bunx wrangler login`) and starts provisioning D1.
