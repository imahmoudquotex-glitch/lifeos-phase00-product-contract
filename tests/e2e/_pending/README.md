# E2E Tests — Pending

These tests require a live HTTP server (Next.js) + real Postgres instance to execute.

They are excluded from the standard `pnpm test` run (unit/integration only).

## Status

| Test | Status | Unblocked By |
|------|--------|--------------|
| auth-flow | Skeleton (describe.skip) | Phase 05 HTTP server wiring |
| workspace-isolation | Skeleton (describe.skip) | Phase 05 HTTP server wiring |
| page-tree | Skeleton (describe.skip) | Phase 05 HTTP server wiring |

## How to Wire (Phase 05)

1. Start Next.js dev server: `pnpm dev`
2. Set `TEST_BASE_URL=http://localhost:3000` and `DATABASE_URL` pointing to a test Neon branch
3. Run: `pnpm test:e2e`

## Stubs Preserved

`*.stub.ts` files in this directory are the original passing stubs from Phase 04.
They are kept for reference only and are NOT run in CI.

## Decision Reference

See `docs/execution/phase-04-decisions-log.md` → D-057 for the rationale.
