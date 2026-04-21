# Verifly Monorepo Cleanup — Execution Checklist

Execution checklist for the consolidation plan. Follow top-to-bottom; do not skip verification steps. The plan document lives at `/Users/samim/.claude/plans/i-have-a-verifly-wild-riddle.md`.

Package scope assumed: `@verifly/*`. If the team picks a different scope, substitute consistently before starting.

---

## 0. Pre-flight

- [x] Create a work branch from `main` (e.g. `refactor/packages-consolidation`).
  - Worked on `claude/dreamy-wu-d37809`.
- [x] Run `bun install` at the repo root; confirm lockfile resolves cleanly.
  - Required renaming all 5 apps from the shared `tanstack_start_ts` name to unique `@verifly/{admin,bank,counselor,student,university}` before Bun workspaces would accept them.
- [x] Baseline build: `bun run build` in each of `apps/{admin,bank,counselor,student,university}`; record any existing warnings so we don't attribute them to the refactor.
  - Baseline lint on admin: 870 errors / 7 warnings (all pre-existing prettier formatting on source files).
- [x] Record baseline artifact sizes (e.g. `du -sh apps/*/dist`) for regression check at the end.
  - admin 3.7M, bank 3.4M, counselor 3.4M, student 2.6M, university 1.8M. Saved to `/tmp/verifly_baseline_sizes.txt`.
- [x] Commit a baseline tag or note the starting SHA so we can diff at the end.
  - Baseline SHA: `06db2da`.

## 1. Stand up `packages/config`

- [x] Create `packages/config/` with:
  - [x] `package.json` — name `@verifly/config`, private, no build step.
  - [x] `tsconfig.base.json` — lifted from the identical app tsconfigs (ES2022, React JSX, bundler resolution). Leave `paths` out of the base.
  - [x] `eslint-preset.js` — lifted from the identical `eslint.config.js`.
  - [x] `components.base.json` — lifted from the identical shadcn config.
  - [ ] `vite-preset.ts` — **skipped**: apps' vite.config.ts is already a single-line `defineConfig()` wrapper over `@lovable.dev/vite-tanstack-config`, and the version is already unified at `^1.4.0` across all 5 apps. No preset needed.
- [x] In each app:
  - [x] `tsconfig.json` → `"extends": "@verifly/config/tsconfig.base.json"`, keeping per-app `paths` overrides.
  - [x] `eslint.config.js` → import and re-export `@verifly/config/eslint-preset`.
  - [x] `components.json` → kept local copies unchanged so `shadcn add` continues to work; `components.base.json` lives in `packages/config` as the canonical reference. Revisit in a later pass if we want to deduplicate further.
- [x] Unify `@lovable.dev/vite-tanstack-config` to `^1.4.0`.
  - Already at `^1.4.0` in all 5 apps; checklist was stale on counselor pinning `^1.3.0`. No change made.
- [x] Rename each `apps/*/wrangler.jsonc` `"name"` to a unique value (`verifly-admin`, `verifly-bank`, `verifly-counselor`, `verifly-student`, `verifly-university`). This fixes a latent deploy collision.
- [x] Verify: `bun run build` succeeds for all 5 apps; `bun run lint` passes.
  - Build ✓ for all 5 apps. Lint reports pre-existing prettier errors only (870 → 869 admin; drop of 1 from a formatting-sensitive line touched incidentally). No new errors introduced.
  - **Note**: `packages/config/package.json` had to declare the eslint plugins (`@eslint/js`, `typescript-eslint`, `eslint-plugin-*`, `globals`) as `dependencies` so Node can resolve them from the preset file's location inside the package; `eslint` and `prettier` themselves stay as `peerDependencies`.

## 2. Stand up `packages/utils`

- [x] Create `packages/utils/` with:
  - [x] `package.json` — name `@verifly/utils`, exports map pointing at `src/index.ts`.
  - [x] `src/cn.ts` — move the shadcn `cn()` helper verbatim (identical across all 5 apps).
  - [x] `src/index.ts` — re-export `cn`.
- [x] Replace imports in all 5 apps:
  - [x] `from "@/lib/utils"` → `from "@verifly/utils"` for `cn` usages (237 files rewritten; all matched `import { cn } from "@/lib/utils"` with no other names).
- [x] Delete `apps/*/src/lib/utils.ts` once no references remain.
- [x] Verify: `bun run typecheck` (or `build`) + `lint` for each app.
  - All 5 apps build ✓. `packages/utils/tsconfig.json` needed `@verifly/config` as a devDep so Vite's tsconfig resolver could walk up from `packages/utils/src/*.ts` to find the extends target.
- [x] Quick grep sanity: `grep -R "from \"@/lib/utils\"" apps/` → no results.

## 3. Stand up `packages/ui` — shadcn primitives

- [x] Create `packages/ui/` with:
  - [x] `package.json` — name `@verifly/ui`. Radix primitives + ancillary runtime deps (`cmdk`, `embla-carousel-react`, `input-otp`, `lucide-react`, `react-day-picker`, `react-hook-form`, `react-resizable-panels`, `recharts`, `sonner`, `vaul`, `class-variance-authority`) are `dependencies`; `react`/`react-dom` are `peerDependencies`; `@verifly/config` and `@types/react*` are `devDependencies`.
  - [x] `tsconfig.json` extending `@verifly/config/tsconfig.base.json`.
  - [x] `components.json` — the canonical shadcn config for future `npx shadcn add` runs (aliases rewritten to `@verifly/ui` and `@verifly/utils`).
  - [x] `src/components/ui/` — copied all **46** primitives (checklist said 50; actual count was 46). Source: admin's copy (byte-identical across apps).
  - [x] `src/hooks/use-mobile.tsx` — moved the `useIsMobile` hook here since `sidebar.tsx` depends on it. Only referenced by sidebar; deleted from all 5 apps.
  - [x] `src/index.ts` — wildcard barrel re-exporting each primitive.
- [x] In each app, replace `from "@/components/ui/<x>"` with `from "@verifly/ui"` (98 app files rewritten).
- [x] Delete `apps/*/src/components/ui/` once no references remain. Also removed the now-empty `apps/*/src/hooks/` directories.
- [x] Verify: build + lint all 5 apps.
  - Build ✓ for all 5 apps. Artifact sizes: admin 3.6M, bank 3.3M, counselor 3.3M, student 2.5M, university 1.7M — within ~3% of baseline (all slightly smaller due to bundler dedup).
  - Admin lint errors: 870 → 291 (drop is just the ~579 pre-existing prettier errors that lived in the primitives which now lint under `packages/ui` instead).
- [ ] **Outstanding**: run one portal in a browser and visually smoke-test buttons, dialogs, forms, tooltips. Not done yet.
- [x] Grep sanity: `grep -R "from \"@/components/ui/" apps/` → no results.

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
