# ADR 0001 — Monorepo & Tooling

- Status: Accepted
- Date: 2024-01-01
- Owner: DX

## Context
LifeOS is a multi-surface product (web app, background worker, future mobile shell). We need a single repository that:
- enforces consistent Node/pnpm versions across contributors and CI,
- allows shared code (types, DB client, route wrappers) to be imported with stable `@lifeos/*` paths,
- supports incremental builds without rebuilding all 60 phases from scratch.

## Decision
Monorepo with **pnpm workspaces** + **Turbo**. Node 20.11.0, ESM only, strict TypeScript.
Tooling stack: eslint + prettier + husky + commitlint + vitest.

```
lifeos/
├── apps/
│   ├── web/          # Next.js 14 (App Router)
│   └── worker/       # Node 20 long-running process
└── packages/
    ├── shared/       # primitive types and utils (zero runtime deps)
    ├── result/       # façade re-export of shared/errors
    ├── db/           # DbClient interface + postgres adapter
    └── route/        # Next.js API route helpers
```

### Why pnpm workspaces?
- Strict peer dependency enforcement (`strict-peer-dependencies=true`).
- Content-addressable store saves disk across packages.
- `workspace:*` protocol makes inter-package dependency graph explicit and auditable.

### Why Turbo?
- Incremental task cache (build, typecheck, test) scoped per package.
- `globalEnv: [NODE_ENV]` ensures cache invalidation when environment changes.
- Pipeline definition in `turbo.json` is the single source of truth for task ordering.

### Why Vitest (not Jest)?
- Native ESM support without transform configuration.
- Vitest v1.x compatible with Node 20.
- Faster cold start than Jest for the test suite sizes expected in Phase 01–03.

## Alternatives Considered
- **npm workspaces** — slower install, weaker peer enforcement, no content-addressable store.
- **yarn berry** — PnP friction with Next.js App Router; additional learning curve.
- **nx** — heavier tooling; graph features not needed until Phase 40+.
- **Jest** — requires `--experimental-vm-modules` for ESM; additional transform config overhead.

## Consequences
- Single source of truth for tooling versions pinned in root `package.json`.
- Every inter-package import must use `@lifeos/*`; relative `../../shared` paths are forbidden and caught by `check-naming.ts`.
- Any drift from pinned versions requires a new ADR with justification.
- Turbo pipeline `ci:guards` runs all 14 architectural gate scripts before merge.

## Enforcement
- `.nvmrc` pins Node 20.11.0.
- `.npmrc` sets `engine-strict=true`.
- `package.json` → `"packageManager": "pnpm@9.0.0"`.
- husky pre-commit runs lint + typecheck + ci:guards.
