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

**(2026-04-23 note: superseded by §13 — we pivoted the backend stack away from Cloudflare before Phase 2 ran. §11 and §12 are kept as an honest record of the v1 decisions, not as current guidance.)**

---

## 13. Backend Phase 0 v2 — Stack pivot to local-first, AWS later (2026-04-23)

Branch: `backend/phase-0-v2-reset`. Replaces the Cloudflare Workers path chosen in §11/§12.

### What

- Hard-reset `apps/api` from Cloudflare Workers to a plain Bun + Hono service:
  - Deleted `apps/api/wrangler.jsonc`.
  - Rewrote `apps/api/package.json` — drops `wrangler`, `@cloudflare/workers-types`, `@cloudflare/vitest-pool-workers`; keeps `hono`, `drizzle-orm`, `zod`, `@noble/hashes`, `nanoid`; scripts now run under `bun` directly (`dev`: `bun run --watch src/server.ts`, `build`: `bun build … --target=bun`, `test`: `vitest`).
  - Rewrote `apps/api/tsconfig.json` — dropped `@cloudflare/workers-types` from `types`, kept `@types/bun`, `lib` still `["ES2022"]`.
- `apps/api/src/index.ts` stays in place for this phase; Phase 1 of v2 replaces it with `src/app.ts` + `src/server.ts`.
- Adopted `checklistBackend.md` v2 (merged via PR #8) as the governing roadmap.

### Why

User asked the direct question: *"can I just change everything to be run locally until I am ready to deploy on AWS, no Cloudflare?"* The pivot is the right call because:

**Runtime family match.** Workers runs on V8 isolates (a limited Web-API surface, no `node:fs`, no sockets). AWS Lambda/Fargate runs Node-compatible runtimes. Building on Bun — which implements the Node API surface — means every line of code we write now is code AWS will execute later. Building on Workers meant a non-trivial port (R2 SDK → S3 SDK, KV → DynamoDB, `env` bindings → `process.env` + Secrets Manager, `waitUntil` → Node async) for no interim benefit since we weren't using the Workers edge advantages anyway.

**Simpler local loop.** `bun run --watch src/server.ts` boots in ~150 ms against a real Node-compatible runtime. No Miniflare emulator, no wrangler config surface, no "works on `wrangler dev` but not on deploy" surprises. Tests run in the same runtime as prod.

**Cost = 30 min of rewrites.** Nothing was ever provisioned in Cloudflare (no `wrangler login`, no D1/R2/KV creates). Four files changed. The v1 Phase 4.1 port/adapter design was specifically built so the swap is ~5 adapter files, not every route — so no route-level rework is needed either.

**AWS still isn't today's problem.** The checklist intentionally defers the actual AWS rollout to a follow-up project. Phase 15 writes the adapter skeleton and parity gates so when that rollout happens it's pure infra work, not application rework.

### How — decisions recorded

**Runtime.** Bun. Native TypeScript, fast startup, Node-compatible API, already the repo's default package manager and JS runtime. Lambda supports custom runtimes if we want Bun in prod; otherwise `hono/aws-lambda` runs the same app under the stock Node runtime — both paths work without source changes.

**Router.** Hono. Runtime-agnostic; same code runs under Bun, Node, Deno, Workers, and Lambda via `hono/aws-lambda`.

**Database.** `bun:sqlite` (built into Bun, zero dep) via Drizzle's `bun-sqlite` driver. Primary dev DB. **Schemas constrained to the SQLite ∩ Postgres intersection** — no JSON columns, no `AUTOINCREMENT`, no SQLite-only defaults, explicit `CHECK` constraints instead of type coercion, text UUIDs, integer-millis timestamps. A parallel Postgres-via-Docker parity track (checklist Phase 14.3) runs the integration suite against Postgres once a week / before schema changes merge, to catch drift *before* AWS day.

**Object storage.** Local filesystem under `apps/api/.storage/` (gitignored). Presigned URLs = HMAC of `method|key|expiresAt|mimeType|maxBytes` using `SESSION_PEPPER`; the API serves `GET /storage/*` and `PUT /storage/*` with signature verification. Same `ObjectStoragePort` interface as the AWS adapter (S3 `getSignedUrl`) will implement.

**Sessions.** SQLite-backed via a `sessions` table with TTL enforcement on read. The `SessionStorePort` interface matches DynamoDB's eventual-TTL semantics so the AWS swap is drop-in.

**Email.** Local stub writes rendered messages to stdout and `./.data/outbox/*.json` (easy test assertions). Provider swap (Postmark / Resend / SES) lands in checklist Phase 11.

**Base URLs.** Dev: `http://localhost:8787` for `@verifly/api`; frontends keep their existing `vite dev` ports (unchanged). AWS URLs deferred to checklist Phase 15; we don't own `verifly.<domain>` yet and Phase 15 is where DNS/zone ownership re-enters the plan.

**AWS target shape (documented now so Phase 15 has no open design questions).** Default: API Gateway HTTP API → Lambda (via `hono/aws-lambda`), RDS Postgres (Aurora Serverless v2 if budget allows, single-AZ `db.t4g.micro` otherwise), S3 for documents, DynamoDB single-table for sessions, SES for email (out-of-sandbox required before prod), Secrets Manager for secrets, EventBridge → a separate cron Lambda for scheduled jobs, CloudWatch + Sentry for logs/errors. Fallback: if any route exceeds Lambda's 15-min / 6 MB limits, move that route (or the whole service) to Fargate behind an ALB — same Hono app, different handler glue.

**DB parity strategy.** Two Drizzle configs point at the same schema directory: `drizzle.config.ts` (SQLite, primary) and `drizzle.postgres.config.ts` (Postgres, parity). A `bun run db:verify-postgres` task starts docker-compose Postgres, generates both migration sets, diffs them for shape divergence, and runs the integration suite against Postgres. Runs weekly or before schema merges — doesn't slow day-to-day work.

### Carryover and reversals from §11/§12

- Cloudflare account topology decision → **obsolete**. No accounts are needed.
- `api.verifly.<domain>` URL scheme → **obsolete for now**. Revisit in Phase 15 when DNS becomes relevant again.
- DNS/zone ownership item → **deferred to Phase 15**, not Phase 11.
- Wrangler as a tool → **dropped entirely**. `bunx wrangler` is no longer needed anywhere.
- The v1 `apps/api/src/index.ts` (Hono worker with `env.VERSION`) → **kept for this commit**, replaced in Phase 1 v2 with `src/app.ts` (factory) + `src/server.ts` (`Bun.serve`).
- The v1 Phase 4.1 port/adapter design → **fully carried over**. `platform/cloudflare/` becomes `platform/local/`; `platform/aws/` is added in Phase 15. Services still take `ctx: Ctx` as first arg; no route changes.

### Open items

- None for Phase 0 v2 — everything is local-only. Next session: Phase 1 v2 (rescaffold `apps/api/src/` into `app.ts` + `server.ts` with `Bun.serve`).

---

## 14. Naming conventions (2026-04-23)

`namingconventions.md` was previously empty. It is now filled in as a strict, opinionated, production-ready document covering file/folder layout, symbols (variables, functions, classes, types, React components), API routes + DTOs, database tables + columns + indexes, and environment variables. Good-vs-bad examples are given for every rule.

### Why these specific rules

**Consistency over preference.** A contributor should be able to predict any name in the codebase without opening the file next to it. That's worth more than any individual rule being "the best one" — the value is in everyone following the same one.

**Case-sensitivity hazards are real.** macOS is case-insensitive by default, Linux CI and Lambda runtimes are case-sensitive. A folder called `UserProfile` on a developer's Mac silently breaks on deploy. Enforcing `kebab-case` for directories and files removes an entire class of "works on my machine" bugs.

**DB and wire casings match their runtime.** Column names are `snake_case` because that's the SQL convention and what Drizzle's column mapper expects; JSON over the wire is `camelCase` because that's what TS code consumes without transformation. Drizzle does the mapping once at the ORM boundary — no ad-hoc `toCamel()` helpers, no mismatched cases in the middle of a service function.

**Portability enforced by naming discipline.** The DB rules (text PKs, integer-millis timestamps, integer+CHECK booleans, no JSON columns, CHECK'd enum strings) are the SQLite ∩ Postgres intersection from §13 made concrete. If you follow the naming rules, you cannot accidentally write a schema that only works on SQLite. If you break them, the weekly Postgres-parity check (checklist Phase 14.3) will catch it before AWS does.

**Security baked into env-var rules.** `VITE_*` gets bundled into the browser. Making that prefix mandatory-for-client-visible and forbidden-for-secrets prevents the classic "we leaked an API key through a Vite env var" incident.

**No TypeScript `enum`.** Enums compile to runtime objects with quirks (reverse mappings, non-tree-shakeable), don't match `z.enum` outputs, and are awkward to serialize. `as const` string tuples are the modern TS idiom and round-trip cleanly through Zod, the wire, and the DB's `CHECK` constraints.

### How this improves maintainability

**Review speed.** Naming deviations become a one-line review comment pointing at the section of this document, not a style debate.

**Onboarding speed.** The document is the canonical answer to "how do I name X in this repo." No tribal knowledge, no reading 50 files to infer the pattern.

**Refactoring safety.** When every foreign key is `<table_singular>_id`, renaming a table is a mechanical grep. When every Zod schema is `<action><Entity>Schema`, finding all the inputs to an endpoint is one search.

**Automation-ready.** Strict rules are enforceable by ESLint (`filename-case`, `naming-convention`) and lint-staged hooks. Loose rules can't be mechanized, so violations accumulate.

**Future-proofing.** The rules explicitly reference the portability contract (SQLite ∩ Postgres, platform-adapter isolation) so when the AWS migration lands (checklist Phase 15), none of the application-code naming needs to change — only the platform adapter. That's the whole point.

### Binding scope

Every rule in `namingconventions.md` applies to every PR merged to `main`. When a rule is wrong, update the document *in the same PR* that changes the code — never allow the document to lag the codebase. When a new pattern emerges (second occurrence of something unnamed), codify it here before the third occurrence.

---

## 15. Backend Phase 2 — SQLite client with WAL + FK pragmas (2026-04-23)

### What

- `apps/api/src/db/client.ts` — `createDb(path)` opens a `bun:sqlite` `Database` and runs four pragmas: `journal_mode=WAL`, `foreign_keys=ON`, `synchronous=NORMAL`, `busy_timeout=5000`. `toDrizzle(sqlite)` returns a Drizzle handle via `drizzle-orm/bun-sqlite`. `resolveDatabasePath(url)` strips the `file:` prefix and passes `:memory:` through unchanged.
- `apps/api/src/db/schema/index.ts` — empty barrel (`export const schema = {} as const`). Phase 3 populates it.
- `apps/api/src/db/pragmas.test.ts` — four `bun:test` specs, one per pragma, each running against a fresh tmp-file SQLite DB.
- `apps/api/package.json` — added scripts `db:migrate` (stub), `db:reset` (deletes `.data/*.sqlite` and `-shm`/`-wal` sidecars), `db:seed` (stub); switched `test` from `vitest` to `bun test`.

Verified: `bun run typecheck` clean, `bun run test` → 4 pass, `bun run dev` still boots and `GET /health` still returns `{"ok":true,"service":"verifly-api","version":"0.0.0"}`.

### Why each pragma

- **`journal_mode=WAL`.** Write-Ahead Logging separates readers from writers. In rollback-journal mode (the SQLite default), a writer blocks all readers for the duration of its transaction; in WAL mode, readers see a consistent snapshot while a writer appends to the WAL file. For a web API with concurrent request handlers all talking to the same DB file, this is the difference between "serialized under load" and "doesn't serialize". WAL is also the mode that survives power loss cleanly.
- **`foreign_keys=ON`.** SQLite parses `FOREIGN KEY` declarations but does **not** enforce them unless this pragma is set — per connection. A fresh handle that forgets this pragma will silently accept orphaned rows. Setting it inside `createDb` ties enforcement to every `Database` this codebase opens, so services never have to remember.
- **`synchronous=NORMAL`.** Controls how aggressively SQLite fsyncs. `FULL` (default for rollback-journal mode) fsyncs on every commit; `NORMAL` fsyncs at checkpoints. `NORMAL` is the documented safe setting for WAL — a crash can lose the last uncommitted transaction but never corrupts the DB — and is what most WAL-mode deployments run.
- **`busy_timeout=5000`.** Connection-local retry budget: if another connection holds the write lock, SQLite retries for up to 5 s before returning `SQLITE_BUSY`. Without this, a transient contention spike becomes a 500 at the API. Five seconds is long enough for a contending write to finish in practice and short enough to fail fast under real pathology.

### Why a tmp-file DB in the pragma test (and not `:memory:`)

The checklist says "spin up an in-memory DB, assert each pragma is set." But SQLite special-cases `:memory:` databases: `journal_mode` cannot be `WAL` on them — SQLite silently downgrades to `"memory"`. If the test used `:memory:`, the WAL assertion would be impossible to satisfy and we'd be testing a pragma that the real code path does apply to the dev DB.

The test creates a fresh file under `mkdtempSync(tmpdir())`, opens the DB there, queries `PRAGMA journal_mode` et al., and `rmSync`s the directory in `afterEach`. Same spirit as the checklist ("don't touch the real dev DB") without the `:memory:` gotcha.

### Why Bun's native test runner, not vitest

`apps/api/package.json` originally declared `vitest` as the test runner, but vitest runs under Node, and Node cannot resolve `bun:sqlite` — the module is a Bun intrinsic with no npm fallback. Running `bunx vitest` doesn't fix it because vitest still drives Node's module resolution internally.

Bun ships a vitest-compatible test runner (`bun test`) that imports from `bun:test` instead of `"vitest"`. Same `describe`/`it`/`expect` surface, runs under Bun so `bun:sqlite` Just Works, and is faster (no vite transform pipeline). We kept `vitest` in `devDependencies` for now in case frontend-adjacent test code ever wants it, but the API package is Bun-native.

### Why `toDrizzle(sqlite)` exists even though no route uses it yet

`createDb` hands back a raw `bun:sqlite` `Database`. Services should never see that type — they see the Drizzle handle, which carries the typed schema. Splitting the two functions means tests can `createDb(path)` and inspect raw pragmas (as `pragmas.test.ts` does), while services compose `toDrizzle(createDb(path))`. The separation also makes the eventual Phase 15 Postgres adapter mechanical: only `toDrizzle` changes to import from `drizzle-orm/node-postgres` instead.

### Why `resolveDatabasePath` parses `file:` URLs

Phase 4.1 will validate env vars through Zod and pass `DATABASE_URL` into the context. The accepted values are `file:./.data/verifly-dev.sqlite` (dev), `file:/absolute/path` (prod-ish), and `:memory:` (tests). `bun:sqlite`'s `Database` constructor takes a path, not a URL, so we need one place to turn the URL form into a path. Doing it in `client.ts` keeps the `file:` contract out of every call site.

### Mistakes to avoid

- **Don't run pragmas once globally.** They're **per-connection** in SQLite. If a future phase opens a second `Database` handle (migrations, a worker, a repl) without going through `createDb`, its foreign-key enforcement will silently turn off. Every handle the API opens goes through `createDb`.
- **Don't mix `journal_mode=WAL` with a network filesystem.** SQLite's WAL implementation assumes local `mmap` semantics. On NFS / EFS / SMB, WAL can corrupt the DB. Dev is fine (local disk); Phase 15 plans Postgres on RDS, not SQLite on EFS, for exactly this reason.
- **Don't commit `.data/`.** `apps/api/.gitignore` ignores the whole directory. Secrets never land there (`.env` is also ignored), but ad-hoc fixtures should go under `tests/` not `.data/`.

### Next up

Phase 3 — Drizzle schema files (one per table), `drizzle.config.ts`, `bunx drizzle-kit generate --name=init`, and a `src/db/migrate.ts` runner. At that point the empty `schema/index.ts` barrel fills out, and `bun run db:migrate` becomes real.

---

## 16. Backend Phase 3 — Drizzle schema + initial migration (2026-04-23)

### What

- `apps/api/src/db/enums.ts` — `as const` tuples for every backend enum (`userRoles`, `organizationKinds`, `applicationStatuses`, `verificationStatuses`, `documentStatuses`, `decisionStatuses`, `applicantTypes`, `documentKinds`) and their derived union types. Single source of truth the schema `CHECK` constraints and future Zod validators both import.
- 14 schema files under `apps/api/src/db/schema/`, one per table, each named after the table in `snake_case`: `users.ts`, `organizations.ts`, `students.ts`, `guardians.ts`, `counselors.ts`, `bank_users.ts`, `university_users.ts`, `applications.ts`, `verifications.ts`, `documents.ts`, `sessions.ts`, `rate_limits.ts`, `audit_log.ts`, `password_resets.ts`. The Drizzle symbol for each is the `camelCase` version (`bankUsers`, `passwordResets`, etc.) per namingconventions.md §1.5.
- `apps/api/src/db/schema/index.ts` — barrel re-exporting every table and a `schema` object literal that `toDrizzle(sqlite)` now consumes.
- `apps/api/drizzle.config.ts` — `dialect: "sqlite"`, `schema: "./src/db/schema"`, `out: "./migrations"`, no `driver` (we own the runner).
- `apps/api/migrations/0000_init.sql` — generated by `bunx drizzle-kit generate --name=init`. 14 `CREATE TABLE`s + 26 indexes, zero SQLite-only keywords.
- `apps/api/src/db/migrate.ts` — CLI that resolves `DATABASE_URL` (default `file:./.data/verifly-dev.sqlite`), opens the DB via `createDb`, runs `drizzle-orm/bun-sqlite/migrator#migrate`, and `process.exit(1)`s on failure. `package.json`'s `db:migrate` now points at it.

Verified: `bun run typecheck` clean, `bun run db:migrate` creates the DB file and applies the migration, `sqlite3 .data/verifly-dev.sqlite ".tables"` lists all 14 tables plus `__drizzle_migrations`, `bun run test` → 4 pass, `GET /health` still returns OK.

### Why a shared `enums.ts`

namingconventions.md §2.7 says enum-like unions must live in `as const` tuples with derived union types, and §4.7 says the DB `CHECK` must list the exact same string literals. If each schema file redeclares its own tuple, they drift the first time someone adds a new status. Hoisting the tuples into one module means: the Drizzle `text("status", { enum: statuses })` type-narrowing, the SQL `CHECK(... IN (...))` constraint (written as a raw SQL list in the schema file because Drizzle's `check()` needs a raw fragment, not a JS array), and the Phase 6 Zod schemas all reference the same source. The DB and the service layer cannot drift.

The enum tuples are also intentionally a **narrower subset** than the permissive unions in `@verifly/types`. The types package still carries historical frontend drift (`admit` and `admitted`, `reject` and `rejected`, `conditional` and `conditional_admit`) because reunifying the portals was out of Phase 0's scope. The backend starts with one canonical value per state; Phase 10 is where we'll rewrite the frontends to match.

### Why one file per table (strict)

Drizzle can tolerate a single `schema.ts` with every table inline — it's mechanically correct. We don't do that because:

- **Circular imports surface immediately with one file per table.** `verifications.ts` references `applications`, which references `organizations`, which has no FK back. If a cycle is introduced, the broken import is a one-line fix. With a single file, the cycle is silent until a test flakes.
- **Review diffs stay small.** A column added to `applications` shouldn't touch `documents.ts`.
- **FK ordering is explicit.** The import order in each file is literally the FK dependency order. Phase 14's seed script will iterate tables in the same order.

namingconventions.md §1.5 also requires this: the file name is the table name in `snake_case`; the symbol is the table name in `camelCase`. That rule is what makes the `bank_users.ts` / `universityUsers` split look weird but be correct.

### Why `migrations/` is run by our own migrator, not drizzle-kit

`drizzle-kit` can both **generate** migration SQL and **apply** it. We only use it for the former. Why:

- `drizzle-kit migrate` requires a `driver` in `drizzle.config.ts` (`better-sqlite3`, `bun-sqlite`, etc.) and reads credentials from its own env shape. We already have `createDb` with the portability pragmas wired in; routing migrations through a second code path would mean two places that can get the pragmas wrong.
- The Phase 15 Postgres cutover changes the migrator import from `drizzle-orm/bun-sqlite/migrator` to `drizzle-orm/node-postgres/migrator` — one line, one file. If migrations went through `drizzle-kit migrate`, we'd be reconfiguring drizzle-kit's driver plus maintaining a parallel CLI surface, instead of just swapping an import inside `src/db/migrate.ts`.
- Owning the runner lets us add pre-migration steps later (seed, schema-validation, SQLite↔Postgres diff) without shelling out to `bunx`.

### Why `ON DELETE` is written out every time

SQLite's FK enforcement is already opt-in via the `foreign_keys=ON` pragma from Phase 2. The **action** on delete, however, is opt-in at the column level: omit it, and the default is `NO ACTION`, which is effectively "error, but only if the violation is detected at commit time." That makes the behaviour subtle and mode-dependent.

Declaring every FK with an explicit `{ onDelete: "cascade" | "restrict" | "set null" }` makes the intent visible at the definition site. Our policy:

- **`cascade`** for "belongs-to-user" and "belongs-to-student" chains (`students → guardians`, `users → sessions`, `users → password_resets`). Deleting the owner removes the orphan rows automatically.
- **`restrict`** for organization refs (`applications.university_id`, `university_users.university_id`). You can't delete a university while student data still points to it — human must decide.
- **`set null`** for nullable FKs on rows that outlive their parent (`documents.application_id`, `verifications.bank_id`). A verification record should survive even if a bank is removed.

This is the SQLite ∩ Postgres safe set — all three actions work identically on both engines, unlike `SET DEFAULT` which is flaky.

### Why `actor_user_id` in `audit_log` is a free-text field, not an FK

`audit_log` rows need to survive after the actor's `users` row is gone (GDPR deletions, retention purges, offboarding). If we put an FK with `ON DELETE CASCADE`, we'd be erasing the audit trail too. If we put `ON DELETE RESTRICT`, we'd be unable to delete the user at all. `SET NULL` is closer but loses the one piece of info we care about.

The pragmatic compromise: store the user ID as free text (still a nanoid), accept that the column doesn't join cleanly after a deletion, and rely on application-level code to render a `"deleted user"` placeholder when the join misses. Audit logs are append-only; they're allowed to reference rows that no longer exist.

### Why `metadata` on `audit_log` is `text`, not a JSON column

SQLite has a `JSON1` extension that presents JSON columns, but Postgres's `jsonb` has different semantics (indexing, operators, NULL handling). Writing the schema against one dialect's JSON flavour closes off the other — exactly the drift namingconventions.md §4.9 forbids. Storing the blob as `text` and parsing it with Zod at read time means:

- Migration to Postgres changes zero schema SQL; we can switch to `jsonb` later if query patterns demand it.
- Writes are always validated against a Zod schema, not whatever shape the app happens to produce today.
- Full-text search and `LIKE` on audit metadata work on both engines without extension detection.

### Mistakes to avoid

- **Don't rely on `{ enum: tuple }` for runtime enforcement.** Drizzle's `text("...", { enum })` is a **TypeScript** narrowing, not a SQL `CHECK`. Every enum column here declares both. Drop the `CHECK` and a handwritten raw INSERT bypasses the restriction.
- **Don't add a column with a default value.** namingconventions.md §1.5 and the Phase 3 portability rules ban `CURRENT_TIMESTAMP` and any SQLite-specific defaults because the service layer owns timestamp generation (Unix millis, clock-injected in tests). `drizzle-kit generate` will cheerfully emit `DEFAULT CURRENT_TIMESTAMP` if you write `.default(sql\`CURRENT_TIMESTAMP\`)` — don't.
- **Don't forget `foreign_keys=ON` in every new DB handle.** If Phase 4 adds a second `Database` handle (migrations script, test fixtures, a worker process), go through `createDb` — the pragma is per-connection. A handle that skips it will silently accept orphaned rows on insert.
- **Don't commit `.data/`.** The migration runner creates `.data/verifly-dev.sqlite` on first run; `apps/api/.gitignore` keeps it out of git. `db:reset` is how you blow it away locally.

### Next up

Phase 4 — core API infrastructure: `errors.ts`, request-id / logger / error-handler middleware, `validate(schema, target)`, response helpers, and the 4.1 platform abstraction that finally wires `Ctx.db = toDrizzle(createDb(...))` into Hono.

## 17. Backend Phase 4 — Core infra + platform abstraction (2026-04-23)

### What shipped

- **Error types** (`src/lib/errors.ts`): `AppError` with `status`, `code`, `message`, `details?`, plus `NotFoundError` (404 `not_found`), `ValidationError` (400 `validation_error`), `UnauthorizedError` (401), `ForbiddenError` (403), `ConflictError` (409), `RateLimitError` (429). Every thrown `AppError` carries enough metadata that the error-handler middleware can serialize it without branching on the class.
- **Middleware**:
  - `request-id.ts` — honours an incoming `X-Request-ID` (≤128 chars) or mints a `nanoid()`, stashes it on the Hono context, and echoes it on the response.
  - `logger.ts` — single structured JSON line per request: `{ level, ts, request_id, method, path, status, duration_ms, user_id? }`. User id is read from `c.get("user")` so Phase 5 can fill it in without touching the logger.
  - `error-handler.ts` — registered via `app.onError(...)`. `AppError` → `{ error: { code, message, details? }, request_id }` at the declared status; anything else → 500 `internal_error`, with `stack` included only when `env !== "prod"`. Always logs a structured `error`-level line so unknown failures still produce observable evidence.
- **Validation + responses**: `lib/validate.ts` is a Hono middleware factory `validate(schema, "body"|"query"|"params")` that Zod-parses the target and throws `ValidationError` with `issues` in `details` on failure, or stores the parsed value on `c.set("validated_body" | "validated_query" | "validated_params")`. `lib/responses.ts` gives `ok`, `created`, `paginated`, `empty` — thin wrappers but they lock the envelope shape (`{ data }` / `{ data, page }`) so Phase 6's `@verifly/api-client` can type responses once.
- **Platform abstraction (4.1)** — `src/platform/`:
  - `ports.ts` — provider-agnostic interfaces: `DbPort` (hands back a `BunSQLiteDatabase<typeof schema>` today; the same return type is what `drizzle-orm/node-postgres` produces when Phase 15 swaps drivers), `SessionStorePort` (get/set/delete/deleteByPrefix with TTL enforced on read), `ObjectStoragePort` (presign upload/download, head, delete), `EmailPort`, `SecretsPort`, `Clock`, and the composite `Ctx`.
  - `local/secrets.ts` — Zod schema over `process.env` (`APP_ENV`, `PORT`, `DATABASE_URL`, `SESSION_PEPPER`, `COOKIE_DOMAIN`, `ALLOWED_ORIGINS`, `STORAGE_DIR`) with safe defaults for dev. `loadEnv()` is the **only** code path that reads `process.env`; everything else pulls strings via `ctx.secrets.get(name)`.
  - `local/db.ts` — wraps `createDb` + `toDrizzle` from Phase 2 behind `DbPort.handle()`.
  - `local/sessions.ts` — SQLite-backed `SessionStorePort`. `get()` filters on `expires_at > now AND revoked_at IS NULL` so callers never see an expired row; `delete()` and `deleteByPrefix()` mark `revoked_at` rather than physically deleting, so the cron sweep in Phase 14 can keep audit-friendly history for as long as it wants.
  - `local/storage.ts` — HMAC-signed URL math for Phase 8: `sign(pepper, "PUT|key|exp|mime|maxBytes")` for uploads, `sign(pepper, "GET|key|exp")` for downloads, with `timingSafeEqual` hex comparison and a strict `assertSafeKey` that blocks `..`, leading `/`, backslashes, and NUL bytes. `head` / `delete` hit the filesystem; the HTTP routes that actually stream bytes arrive in Phase 8.
  - `local/email.ts` — logs every send as a structured JSON line and, outside `APP_ENV=prod`, drops a JSON file into `.data/outbox/` so tests can assert on it.
  - `local/index.ts` — `createLocalContext({ requestId })` builds the `Ctx` once (singletons for db/sessions/storage/email/secrets/clock) and then per-request only the `requestId` differs. Exposes `resetLocalContext()` so tests can tear down the singleton between runs.
  - `platform/index.ts` — re-exports the ports + `createContext({ requestId })`. Phase 15 adds an `aws` branch here gated on `APP_ENV`/`AWS_REGION`; route handlers never notice.
- **`app.ts` wiring**: middleware order is `onError → requestId → logger → ctx → routes`. `createApp({ env, version? })` is the bootstrap — no `process.env.VERSION` inside the app; `server.ts` is the single place that reads it. Hono generics now carry `{ Variables: { requestId, ctx, user?, validated_* } }` so routes get typed `c.get("ctx")` for free.
- **ESLint** (`apps/api/eslint.config.js`, backend-only, no React plugins): a `no-restricted-imports` rule under `src/routes/**` and `src/services/**` blocks imports from `**/platform/local/**`, `bun:sqlite`, and `node:fs*`. Routes and services have exactly one door: `@/platform`.

### Why the shape of 4.1 matters

The portability promise in the checklist is "swap ~5 files, not every route" when we move to AWS in Phase 15. That only holds if services can't reach past the neutral barrel. Three mechanics enforce it, in increasing strength:

1. **Type gravity** — services accept `ctx: Ctx` as their first argument. The `Ctx` interface only mentions ports, never `Database` or `node:fs`. If a handler tries to use a concrete driver, TypeScript complains before the runtime does.
2. **Single construction point** — `platform/index.ts:createContext` is the only function that instantiates adapters. Phase 15's `aws` branch slots in beside `local` and nothing else changes.
3. **Lint boundary** — the `no-restricted-imports` rule catches the "oh I'll just import `bun:sqlite` here quickly" mistake. Without it, the type system would allow `import { Database } from "bun:sqlite"` in a route because TypeScript doesn't model which module is "allowed" — it just cares about the resulting types.

The verification grep (`grep -RnE "bun:sqlite|node:fs|process\.env" src --include="*.ts" | grep -vE "platform/local|db/migrate|db/client|server\.ts|\.test\.ts"`) is the fast-feedback version of rule 3. CI will run it alongside `eslint` so both layers are green before merge.

### Decisions & deviations

- **`Ctx` is built per-request, adapters are singletons.** The first request lazily opens the SQLite handle, the storage dir, etc. Subsequent requests reuse them; only `requestId` differs. This avoids a per-request `new Database(...)` (which would reset WAL state every hit) without giving up the "everything comes from `ctx`" discipline. `resetLocalContext()` is exported for tests that need a clean slate.
- **`EmailPort.send` returns `Promise<void>` and swallows nothing.** Phase 11 will wrap the call in a fire-and-forget helper that catches + logs so a flaky provider can't wedge a request; keeping the port itself strict means tests can `await` it deterministically.
- **`BunSQLiteDatabase<typeof schema>` leaks into `DbPort`.** The checklist explicitly says the signature should match `drizzle-orm/bun-sqlite`'s return so services don't change when the driver swaps. In Phase 15, `DbHandle` becomes `BunSQLiteDatabase<typeof schema> | NodePgDatabase<typeof schema>` (or a narrower intersection) and queries that only use portable Drizzle features keep compiling. If a query does need a driver-specific escape hatch, we'll push it into a service method that the `aws` adapter can override — the port stays stable.
- **Storage signing uses `SESSION_PEPPER`, not a separate key.** One high-entropy secret covers both the session-token HMAC (Phase 5) and the signed-URL HMAC (Phase 8). Rotating one rotates both. The payloads are domain-separated by the `PUT|`/`GET|` prefix so a download-signed URL can't be replayed as an upload.
- **`validate()` stores parsed input on `c` rather than passing it through a typed wrapper.** Hono's context-variable approach is slightly less type-safe than `createFactory`/zod-openapi, but it keeps routes readable (`const body = c.get("validated_body") as CreateStudent`) and doesn't force a handler-signature generic that leaks into every route file. Phase 7 will add a tiny typed getter if the cast boilerplate becomes noisy.

### Verification ran

- `bun run typecheck` — clean.
- `bun test` — 6 pass / 0 fail (pragmas + the new `error-handler.test.ts` covering AppError serialization and unknown-error 500 in `prod`).
- Isolation audit: `grep -RnE "bun:sqlite|node:fs|process\.env" src --include="*.ts" | grep -vE "platform/local|db/migrate|db/client|server\.ts|\.test\.ts"` → empty.

### Gotchas to remember

- **Don't call `createContext` outside the ctx middleware.** Migrations (`src/db/migrate.ts`) and the CLI scripts coming in Phase 14 still open their own `bun:sqlite` handles directly — those are explicitly allowed (they're entry points, not request handlers) and are excluded from the isolation grep by path.
- **Don't throw non-`AppError` instances for user-facing failures.** The error-handler treats anything that isn't an `AppError` as a 500, which is the right default for bugs but wrong for e.g. auth failures. If you need a new status/code, add a subclass to `errors.ts`.
- **Don't log `ctx.secrets.get("SESSION_PEPPER")` or any raw env value.** The logger middleware intentionally has no "dump env" branch; adding one is a footgun waiting to happen.
- **Don't import from `@/platform/local/*` in routes or services.** The ESLint rule will flag it; the grep will flag it; Phase 15's adapter swap will silently break if either escape hatch slips in.

### Next up

Phase 5 — auth subsystem: argon2id password hashing with `SESSION_PEPPER` mixed in, SQLite-backed session store using the `ctx.sessions` port, `/auth/*` routes, `requireAuth`/`requireRole` middleware, CSRF double-submit, and the rate limiter on top of the `rate_limits` table.

