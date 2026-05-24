```
# Phase 01 — Architecture Contracts & Naming Freeze — Outputs

## A. Packages (guaranteed)
- `@lifeos/shared` — ids/newUlid, time/Clock, money, errors (AppError + ErrorCode + Result), envelope (STATUS_MAP + statusForError), pagination/cursor, env/server-env (+ resetServerEnvCache), logger.
- `@lifeos/result` — façade re-export of `@lifeos/shared/errors`. NO new definitions.
- `@lifeos/db` — `DbClient` interface (`one/oneOrNone/many/none/tx`) + `postgres-adapter` over `postgres` + `withWorkspaceContext` (sets `app.current_user_id` + `app.current_workspace_id` per-tx).
- `@lifeos/route` — `withApiErrorHandling`, `withUserRoute` (stub), `withWorkspaceRoute` (stub), `parseJsonBody`, `requireIdempotencyKey`.

## B. Apps (guaranteed)
- `@lifeos/app-web` — Next.js 14 skeleton with `/api/health` returning `envelopeOk({ status: 'ok', phase: '01' })`.
- `@lifeos/app-worker` — placeholder logger boot.

## C. Scripts (guaranteed)
- `scripts/check-mvp-scope.ts` (from Phase 00; reused as-is).
- 5 active guards: `check-naming`, `check-no-sql-in-routes`, `check-no-ai-direct-provider`, `check-timezone-hardcode`, `check-no-duplicate-app-error`.
- 9 placeholder guards wired into `ci:guards` and ready for activation: `check-migrations` (P02), `check-rls` (P02), `check-routes-envelope` (P02), `check-idempotency` (P02), `check-money-columns` (P02), `check-no-vault-leak` (P04), `check-encryption-primitives` (P04), `check-no-design-drift` (P05), plus reserved slots.

## D. Git artefacts (guaranteed)
- Branch: `phase/01-architecture` (merged into `main` before lock).
- Annotated tag: `phase-01-locked` (replaces deprecated `w00-frozen`).

## E. Env vars introduced
- `NODE_ENV` (development|test|production)
- `DATABASE_URL` (required at runtime; throws `ENV_MISSING` if absent)
Both documented in `.env.example` at repo root.

## F. Migration range used
None. Phase 01 reserves `0001..0099` but creates no migrations. Phase 02 starts at `0100__*.sql`.

## G. Stubs left behind for later phases
- `withUserRoute` and `withWorkspaceRoute` throw `AUTH_REQUIRED` until Phase 02 (workspace context) + Phase 05 (session lookup).
- `check-migrations`, `check-rls`, `check-routes-envelope`, `check-idempotency`, `check-money-columns` → activate in Phase 02.
- `check-no-vault-leak`, `check-encryption-primitives` → activate in Phase 04.
- `check-no-design-drift` → activate in Phase 05.
- `packages/ai` → first import in Phase 06.

## H. ADRs introduced
- ADR 0001 — Monorepo & Tooling.
- ADR 0002 — Naming Conventions.
- ADR 0003 — DB Client Interface.
- ADR 0004 — Errors, Result, and Time Exceptions.

## I. Documents introduced
- 6 architecture docs in `docs/architecture/`.
- `docs/runbooks/rollback.md` (rollback protocol).
- `.env.example` (env SoT).

## J. Open risks carried forward
All 11 risks from Phase 00 remain Open. Phase 01 partially mitigates:
- RISK-005 (vendor lock-in) → `@lifeos/db` interface abstracts the driver.
- RISK-011 (duplicate SoT) → `check-no-duplicate-app-error` enforces single AppError.
Phase 02 inherits the rest.
```
