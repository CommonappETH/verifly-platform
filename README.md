# Verifly Platform

Monorepo for the Verifly portal suite. Five portal apps (admin, bank, counselor, student, university) share four workspace packages for UI, types, utilities, and tooling config.

## Workspace layout

```
verifly-platform/
├── apps/                       # Portal apps — thin, routes + app-specific views
│   ├── admin/                  # @verifly/admin       — platform ops
│   ├── bank/                   # @verifly/bank        — bank-side verifications
│   ├── counselor/              # @verifly/counselor   — counselor portal
│   ├── student/                # @verifly/student     — student portal
│   └── university/             # @verifly/university  — university admissions
├── packages/                   # Shared libraries (workspace-resolved)
│   ├── ui/                     # @verifly/ui     — shadcn primitives + composed
│   ├── types/                  # @verifly/types  — domain enums + entity skeletons
│   ├── utils/                  # @verifly/utils  — cn, formatters, masks, tone maps
│   └── config/                 # @verifly/config — tsconfig/eslint/shadcn presets
├── package.json                # Workspaces root — hoists third-party deps
└── bun.lock                    # Single lockfile at the root
```

## Getting started

```bash
bun install                     # installs all workspace deps at the root
cd apps/admin && bun run dev    # or: bank, counselor, student, university
```

Every app exposes the same scripts: `dev`, `build`, `build:dev`, `preview`, `lint`, `format`.

## Adding dependencies

- **Third-party deps shared by multiple apps**: declare in the root `package.json` only. Bun hoists them so each app resolves them through the root `node_modules/`.
- **App-specific third-party deps**: declare in that app's `package.json`.
- **Shared UI primitives**: add to `packages/ui` (see "Adding a new shadcn component" in [learningguide.md](learningguide.md) §5), export from `packages/ui/src/index.ts`, and import as `@verifly/ui`.
- **Shared types/enums**: add to `packages/types` (see `learningguide.md` §6–7, §9b) and import as `@verifly/types`.
- **Framework-agnostic helpers**: add to `packages/utils` and import as `@verifly/utils`.

## Import rules

- `apps/*` may import from any `@verifly/*` package.
- `@verifly/ui` may import from `@verifly/types`, `@verifly/utils`.
- `@verifly/utils` may import from `@verifly/types`.
- `@verifly/types` is a leaf — it imports nothing.
- `packages/*` must **never** import from `apps/*`.
- Never reach into another package's `src/` — always go through the package entrypoint.

## Deploy

Each app deploys as its own Cloudflare Worker. Worker names live in `apps/<app>/wrangler.jsonc` as `verifly-<app>` — do not reuse names across apps.

## Further reading

- [checklist.md](checklist.md) — cleanup refactor execution checklist.
- [learningguide.md](learningguide.md) — deep-dive on why the refactor exists, the `tone` contract for composite components, the enum casing decision, shared types patterns, dep hoisting, and deferred follow-ups.
- [AIRULES.md](AIRULES.md) — hard rules for AI-assisted changes.
