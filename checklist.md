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

- [x] `StatusBadge` — unified to a tone-driven API `{ label, tone, size?, className? }`. Lives at `packages/ui/src/components/composed/status-badge.tsx`. No app-specific status strings inside the component; each app owns the status→tone mapping.
  - admin/bank/counselor: added `apps/{admin,bank,counselor}/src/lib/status-badge.ts` with a `statusBadgeProps(status)` helper; call sites use `<StatusBadge {...statusBadgeProps(s)} />`.
  - **Deviation**: `apps/student/src/components/StatusBadge.tsx` was kept as a ~30-line adapter that translates student's existing `label`+`variant`+`size` API to the shared `label`+`tone`+`size` API (maps `muted` → `neutral`). Student's call sites (30+) drive `variant` from inline data maps; rewriting them all would have been a much larger, riskier diff for no structural win. The duplicate *implementation* is gone — only the API translation remains per-app.
- [x] `EmptyState` — API `{ title, description?, icon?, action?, className? }`. Lives at `packages/ui/src/components/composed/empty-state.tsx`. Admin's `hint` prop was renamed to `description`; admin's bare `<EmptyState />` calls now pass `title="No results"` explicitly. Student's copy was unused and was deleted.
- [x] `StatCard` (canonical name; `KpiCard` is retired) — unified API `{ label, value, icon?, delta?, hint?, tone?, iconClassName?, className? }`. Supports admin's colored-icon-box pattern (via `iconClassName`) and university's toned-card pattern (via `tone`). Admin's `<KpiCard icon={IconComponent} />` call sites were rewritten to pass JSX `icon={<IconComponent className="h-5 w-5" />}`. Admin's `"+8"` deltas were extended to `"+8 vs last week"` at the call site since the shared component no longer hardcodes that suffix. Bank and student each had an *inline* `KpiCard`/`StatCard` function defined in a route file — both were deleted and replaced with imports from `@verifly/ui`.
- [x] Moved to `packages/ui/src/components/composed/`; re-exported from `@verifly/ui`.
- [x] Replaced per-app imports; deleted per-app copies (`apps/admin/src/components/admin/{StatusBadge,EmptyState,KpiCard}.tsx`, `apps/bank/src/components/bank/StatusBadge.tsx`, `apps/counselor/src/components/StatusBadge.tsx`, `apps/student/src/components/EmptyState.tsx`, `apps/university/src/components/StatCard.tsx`). Student's `StatusBadge.tsx` retained as the adapter noted above.
- [x] Build ✓ for all 5 apps. Lint reports only pre-existing errors — admin 290 (baseline 291, one fewer because deleted files took prettier errors with them); no new errors introduced.
- [ ] **Outstanding**: run admin and student portals in a browser and visually smoke-test StatusBadge, EmptyState, StatCard. Not done yet.

## 5. Stand up `packages/types`

Highest-risk step. Requires naming decisions first — document them in `learningguide.md` (sections 6 and 7) before coding.

- [x] Decide and document: enum value casing — **snake_case** is canonical. Documented in `learningguide.md` §6.
- [x] Decide and document: entity canonical names — `Student` canonical; `StudentProfile` and `Applicant` retired. Documented in `learningguide.md` §7.
- [x] Create `packages/types/` with:
  - [x] `package.json` — name `@verifly/types`, no runtime exports (types-only).
  - [x] `src/status.ts` — unified `ApplicationStatus`, `VerificationStatus`, `DocumentStatus`, `UserRole` (plus `ApplicantType`, `DecisionStatus`). All values snake_case.
  - [x] `src/user.ts` — `User`, `Student`, `Guardian`, `Counselor`, `BankUser`. Canonical `Student` has cross-app common fields; app-specific rich fields stay in each app's local `types.ts`.
  - [x] `src/application.ts` — `Application` with a superset of fields; all non-identity fields optional so portal apps consume only what they need.
  - [x] `src/verification.ts` — `Verification` (superset over `VerificationRequest` + admin `Verification` + `FinancialVerification`).
  - [x] `src/document.ts` — `Document`, `DocumentKind` (snake_case kinds).
  - [x] `src/index.ts` — barrel.
- [x] Migrate one app at a time:
  - [x] university (converted `"under-review"` → `"under_review"` and 16 other kebab→snake tokens across 11 files via a scoped sed pass; renamed type `Applicant` → `Student` in `lib/types.ts` and call sites). Routes/UI strings/function names (`applicants_.$id`, `getApplicant`, "Applicants") intentionally kept — only the retired *type* name was renamed.
  - [x] student (renamed type `StudentProfile` → `Student`; re-exported shared enums). Kept rich optional fields local since they are student-portal-specific.
  - [x] admin (re-exported shared enums from `apps/admin/src/lib/admin-mock/types.ts`; admin's local unions are subsets of the shared unified unions so no value rewrites were needed).
  - [x] bank (used `Extract<VerificationStatus, ...>` and `Extract<DocumentStatus, ...>` to keep bank's narrower `RequestStatus` / `DocumentStatus` aliases tied to shared enums. Kept bank's local narrow `Student`/`Guardian` interfaces since widening them to shared-optional fields would break `r.student.fullName` call sites).
  - [x] counselor (same `Extract<>` pattern; counselor's `RequestStatus` = `"pending" | "completed" | "overdue"` kept local since those values aren't in shared `VerificationStatus` — this is a distinct "document-request lifecycle" concept).
- [x] After each app: `bun run build` + `lint` pass. All 5 apps build ✓; lint shows only pre-existing prettier / `no-explicit-any` issues (no new errors).
- [x] Move the formatter helpers (`formatDate`, `formatCurrency`, `formatDateTime`, `formatRelative`, `daysUntil`, `initials`, plus `STATUS_LABEL` / `STATUS_TONE` / `VERIF_LABEL` / `VERIF_TONE` / `TYPE_TONE` / `DECISION_LABEL` / `DECISION_TONE` maps) into `packages/utils/src/format.ts`. Also moved `maskAccount` from `apps/bank/src/lib/api.ts` into `packages/utils/src/mask.ts`. Each app's local `format.ts` / `api.ts` is now a thin re-export of `@verifly/utils`, so existing call sites continue to work without rewrites.
  - **Note**: `@verifly/utils` now has `@verifly/types` as a `devDependency` so the tone/label maps can be typed by the unified enum unions.
  - **Deviation**: counselor's `formatDate` previously used `toLocaleDateString(undefined, ...)` (browser locale); unified version uses `"en-US"` to match bank/university. Visual difference only for non-US browser locales; acceptable per the unification intent.

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
