# ADR 0002 — Naming Conventions

- Status: Accepted
- Date: 2024-01-01
- Owner: DX

## Context
Inconsistent naming across a 60-phase project causes merge conflicts, confuses IDE auto-import, and breaks glob-based CI guards.

## Decision
See **Section 18** of `docs/governance/global-conventions.md` for the authoritative table. Summary:

| Surface | Convention | Example |
|---|---|---|
| DB tables | `snake_case` plural | `workspace_members` |
| DB columns | `snake_case` | `created_at` |
| Source files | `kebab-case` | `server-env.ts` |
| Directories | `kebab-case` | `packages/shared/src/ids/` |
| Routes | `/api/v1/<plural>` | `/api/v1/workspaces` |
| Packages | `@lifeos/<name>` | `@lifeos/shared` |
| TS types | `PascalCase` | `ApiEnvelope` |
| TS variables/functions | `camelCase` | `newUlid` |
| Env vars | `SCREAMING_SNAKE_CASE` | `DATABASE_URL` |
| Git branches | `phase/NN-description` | `phase/01-architecture` |
| Git tags | `phase-NN-locked` | `phase-01-locked` |
| Migrations | `NNNN__snake_case.sql` | `0100__create_workspaces.sql` |

## Alternatives Considered
- **PascalCase files** — rejected; inconsistent with Node.js ecosystem defaults and causes issues on case-insensitive macOS filesystems.
- **camelCase packages** — rejected; `@lifeos/appWeb` is harder to grep and non-idiomatic for npm scope.

## Consequences
- `scripts/check-naming.ts` runs in `ci:guards` and fails CI on any capitalized directory or migration mismatch.
- New resources (tables, routes, packages) in any of Phases 01–60 must follow this table or open a new ADR.
- ADR 0002 is the blocker for merge of any PR that introduces naming drift.

## Enforcement
`scripts/check-naming.ts` + this ADR.
CI breaks if a directory under `packages/`, `scripts/`, `apps/`, or `migrations/` violates the pattern.
