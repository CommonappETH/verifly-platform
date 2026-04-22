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

## 10. Known follow-ups

Deferred on purpose; revisit once the consolidation is merged:

- **`@verifly/api`** — each portal currently has its own `src/lib/api.ts` or `src/lib/*-mock/` module. Once the backend contracts stabilize, consolidate the HTTP client, query keys, and response schemas into a shared package that consumes `@verifly/types`.
- **`@verifly/mocks`** — mock fixtures (`apps/admin/src/lib/admin-mock/`, `apps/bank/src/lib/mock-data.ts`, etc.) are currently per-app. If we end up wanting consistent mock personas across portals for dev/testing, extract into a shared package.
- **Shared layout primitives** — `AppShell`, `AppLayout`, `AppSidebar`, `TopBar` are currently per-app because they're tied to app-specific routes. If a common layout skeleton emerges (header slot + sidebar slot + content), consider a headless `AppShell` in `@verifly/ui` with per-app route configs injected as props.
- **`airules.md` and `namingconventions.md`** — currently empty. Populate them if/when the team wants a shorter contributor-facing summary of the conventions in this guide.
