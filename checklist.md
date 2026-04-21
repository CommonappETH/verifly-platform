# Verifly Monorepo Cleanup — Execution Checklist

Execution checklist for the consolidation plan. Follow top-to-bottom; do not skip verification steps. The plan document lives at `/Users/samim/.claude/plans/i-have-a-verifly-wild-riddle.md`.

Package scope assumed: `@verifly/*`. If the team picks a different scope, substitute consistently before starting.

---

## 0. Pre-flight

- [ ] Create a work branch from `main` (e.g. `refactor/packages-consolidation`).
- [ ] Run `bun install` at the repo root; confirm lockfile resolves cleanly.
- [ ] Baseline build: `bun run build` in each of `apps/{admin,bank,counselor,student,university}`; record any existing warnings so we don't attribute them to the refactor.
- [ ] Record baseline artifact sizes (e.g. `du -sh apps/*/dist`) for regression check at the end.
- [ ] Commit a baseline tag or note the starting SHA so we can diff at the end.

## 1. Stand up `packages/config`

- [ ] Create `packages/config/` with:
  - `package.json` — name `@verifly/config`, private, no build step.
  - `tsconfig.base.json` — lifted from the identical app tsconfigs (ES2022, React JSX, bundler resolution). Leave `paths` out of the base.
  - `eslint-preset.js` — lifted from the identical `eslint.config.js`.
  - `components.base.json` — lifted from the identical shadcn config.
  - `vite-preset.ts` — re-exports `defineConfig` wrapper if we need one; otherwise apps keep their thin wrapper and just upgrade the underlying `@lovable.dev/vite-tanstack-config` version.
- [ ] In each app:
  - [ ] `tsconfig.json` → `"extends": "@verifly/config/tsconfig.base.json"`, keeping per-app `paths` overrides.
  - [ ] `eslint.config.js` → import and re-export `@verifly/config/eslint-preset`.
  - [ ] `components.json` → extend or mirror the base (decide if shadcn generator still needs a local copy).
- [ ] Unify `@lovable.dev/vite-tanstack-config` to `^1.4.0` (currently counselor pins `^1.3.0`).
- [ ] Rename each `apps/*/wrangler.jsonc` `"name"` to a unique value (`verifly-admin`, `verifly-bank`, `verifly-counselor`, `verifly-student`, `verifly-university`). This fixes a latent deploy collision.
- [ ] Verify: `bun run build` succeeds for all 5 apps; `bun run lint` passes.

## 2. Stand up `packages/utils`

- [ ] Create `packages/utils/` with:
  - `package.json` — name `@verifly/utils`, exports map pointing at `src/index.ts`.
  - `src/cn.ts` — move the shadcn `cn()` helper verbatim (identical across all 5 apps).
  - `src/index.ts` — re-export `cn`.
- [ ] Replace imports in all 5 apps:
  - `from "@/lib/utils"` → `from "@verifly/utils"` for `cn` usages.
- [ ] Delete `apps/*/src/lib/utils.ts` once no references remain.
- [ ] Verify: `bun run typecheck` (or `build`) + `lint` for each app.
- [ ] Quick grep sanity: `grep -R "from \"@/lib/utils\"" apps/` → no results.

## 3. Stand up `packages/ui` — shadcn primitives

- [ ] Create `packages/ui/` with:
  - `package.json` — name `@verifly/ui`, peer deps on `react`, `react-dom`, `@radix-ui/*` primitives the components use.
  - `tsconfig.json` extending `@verifly/config/tsconfig.base.json`.
  - `components.json` — the canonical shadcn config for future `npx shadcn add` runs.
  - `src/components/ui/` — copy in all 50 primitives (accordion → tooltip). They are byte-identical across apps; pick any one as source.
  - `src/index.ts` — re-export each primitive.
- [ ] In each app, replace `from "@/components/ui/<x>"` with `from "@verifly/ui"`.
- [ ] Delete `apps/*/src/components/ui/` once no references remain.
- [ ] Verify: build + lint all 5 apps; run one portal in a browser and visually smoke-test buttons, dialogs, forms, tooltips.
- [ ] Grep sanity: `grep -R "from \"@/components/ui/" apps/` → no results.

## 4. Stand up `packages/ui` — composite components

Each of the following needs a short design pass before moving (the per-app versions diverge slightly):

- [ ] `StatusBadge` — unify admin, bank, counselor, student versions. Drive by a union-type `status` prop and a `tone` map; no app-specific status strings inside the component.
- [ ] `EmptyState` — unify admin and student versions. API: `title`, `description?`, `icon?`, `action?` (ReactNode slot).
- [ ] `StatCard` (rename `KpiCard` → `StatCard` for consistency) — unify admin (`KpiCard`) and university (`StatCard`). API: `label`, `value`, `delta?`, `icon?`.
- [ ] Move to `packages/ui/src/components/composed/`; re-export from `@verifly/ui`.
- [ ] Replace per-app imports; delete per-app copies.
- [ ] Verify: build + lint + visual smoke on admin and student (they use the most composites).

## 5. Stand up `packages/types`

Highest-risk step. Requires naming decisions first — document them in `learningguide.md` (sections 6 and 7) before coding.

- [ ] Decide and document: enum value casing (recommend **snake_case** to match the backend).
- [ ] Decide and document: entity canonical names. Recommendation: `Student` is canonical; `StudentProfile` and `Applicant` are retired. Admissions-specific fields live on `Student` as optional properties, or in a separate `Admission` type.
- [ ] Create `packages/types/` with:
  - `package.json` — name `@verifly/types`, no runtime exports (types-only).
  - `src/status.ts` — unified `ApplicationStatus`, `VerificationStatus`, `DocumentStatus`, `UserRole`.
  - `src/user.ts` — `User`, `Student`, `Guardian`, `Counselor`, `BankUser`.
  - `src/application.ts` — `Application` (with the superset of fields apps actually use).
  - `src/verification.ts` — `Verification` (consolidating `VerificationRequest`, `FinancialVerification`).
  - `src/document.ts` — `Document`, `DocumentKind`.
  - `src/index.ts` — barrel.
- [ ] Migrate one app at a time:
  - [ ] university (converts `under-review` → `under_review`; expect the biggest diff)
  - [ ] student
  - [ ] admin (includes `apps/admin/src/lib/admin-mock/types.ts`)
  - [ ] bank
  - [ ] counselor
- [ ] After each app: `bun run typecheck` + `lint` must pass before moving to the next.
- [ ] Move the formatter helpers (`formatDate`, `formatCurrency`, `formatRelative`, `daysUntil`, `initials`, plus `STATUS_LABEL` / `STATUS_TONE` maps that depend on the unified enums) from `apps/counselor/src/lib/format.ts` and `apps/university/src/lib/format.ts` into `packages/utils/src/format.ts`. Also move `maskAccount` from `apps/bank/src/lib/api.ts` to `packages/utils/src/mask.ts`.

## 6. Finish-up

- [ ] Hoist the 47 shared deps from per-app `package.json` into the root `package.json` (Bun workspaces will resolve them).
- [ ] Remove per-app `package-lock.json` files — Bun workspaces use `bun.lockb` at the root.
- [ ] Update the root `README.md` with the new package layout and a pointer to `learningguide.md`.
- [ ] Run the full verification section below.
- [ ] Tag `v0.2.0-cleanup` once everything is green.

---

## Verification (end-to-end gate)

Do not merge until all pass:

- [ ] `bun install` at root succeeds with no unresolved workspace references.
- [ ] `bun run build` in each of the 5 apps completes with zero TS errors.
- [ ] `bun run lint` passes for every app and every package.
- [ ] Visual smoke on **admin** and **student** portals shows unchanged UI (buttons, badges, empty states, dialogs, tooltips render identically to baseline).
- [ ] `grep -R "from \"@/components/ui/" apps/` → empty.
- [ ] `grep -R "from \"@/lib/utils\"" apps/` → empty.
- [ ] Each `apps/*/wrangler.jsonc` has a unique `name`.
- [ ] Root `package.json` lists the shared deps once; per-app `package.json` files only list app-specific deps.
- [ ] Build artifact sizes are within ±5% of baseline (no accidental duplication via bundler failing to dedupe).

---

## Out of scope for this checklist

- New features; API/data-layer work; backend changes.
- A `packages/api` or `packages/mocks` (flagged as follow-up in `learningguide.md`).
- Populating `airules.md` or `namingconventions.md` (currently empty).
