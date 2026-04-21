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

## 10. Known follow-ups

Deferred on purpose; revisit once the consolidation is merged:

- **`@verifly/api`** — each portal currently has its own `src/lib/api.ts` or `src/lib/*-mock/` module. Once the backend contracts stabilize, consolidate the HTTP client, query keys, and response schemas into a shared package that consumes `@verifly/types`.
- **`@verifly/mocks`** — mock fixtures (`apps/admin/src/lib/admin-mock/`, `apps/bank/src/lib/mock-data.ts`, etc.) are currently per-app. If we end up wanting consistent mock personas across portals for dev/testing, extract into a shared package.
- **Shared layout primitives** — `AppShell`, `AppLayout`, `AppSidebar`, `TopBar` are currently per-app because they're tied to app-specific routes. If a common layout skeleton emerges (header slot + sidebar slot + content), consider a headless `AppShell` in `@verifly/ui` with per-app route configs injected as props.
- **`airules.md` and `namingconventions.md`** — currently empty. Populate them if/when the team wants a shorter contributor-facing summary of the conventions in this guide.
