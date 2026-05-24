# Global Conventions — Single Source of Truth

All phases (01 → 60) MUST follow this file exactly. Any contradiction = this file wins.

## 1. Runtime
- Node 20.11.0 (`.nvmrc`).
- pnpm 9.0.0.
- ESM only (`"type": "module"`).
- TypeScript strict + ES2022 + Bundler resolution.
- Test runner: vitest. Lint: eslint flat. Format: prettier. Build: turbo.

## 2. Package scope
- Every package in `packages/<dir>` is named `@lifeos/<dir>`.
- Every app in `apps/<dir>` is named `@lifeos/app-<dir>`.
- Imports MUST use `@lifeos/<name>`. Relative paths to other packages are forbidden.

## 3. Identifiers
- `id TEXT PRIMARY KEY` for every business table.
- ULID, app-generated via `@lifeos/shared/ids/newUlid()`.
- Forbidden in business tables: UUID, SERIAL, BIGSERIAL.

## 4. Money
- `*_cents BIGINT` for every amount column.
- `currency CHAR(3)`.
- Rates as INTEGER basis points (1250 = 12.50%).
- Forbidden: NUMERIC, DECIMAL, FLOAT, REAL, DOUBLE PRECISION on business tables.

## 5. Time
- Every datetime = TIMESTAMPTZ in UTC.
- Forbidden `new Date()` in business logic; use `Clock` from `@lifeos/shared/time`.

## 6. Errors
- `AppError`, `ErrorCode`, `Result`, `ok`, `err`, `isOk`, `isErr` live in `@lifeos/shared/errors` only.
- ErrorCode format: `<DOMAIN>_<REASON>` UPPER_SNAKE.

## 7. API envelope
- Success: `{ ok: true, data: T, meta?: object }`.
- Failure: `{ ok: false, error: { code: string, message: string, metadata?: object } }`.

## 8. Route wrappers (from `@lifeos/route`)
- `withApiErrorHandling`, `withUserRoute`, `withWorkspaceRoute`, `parseJsonBody(req, ZodSchema)`, `requireIdempotencyKey(req)`.

## 9. DB client contract

```
interface DbClient {
  one<T>(sql, params?): Promise<T>;
  oneOrNone<T>(sql, params?): Promise<T | null>;
  many<T>(sql, params?): Promise<T[]>;
  none(sql, params?): Promise<void>;
  tx<T>(fn): Promise<T>;
}
```

Implementation lives in `@lifeos/db` over `postgres`. Forbidden to import `pg` / `pg-promise` / `prisma` elsewhere.

## 10. Workspace context
- `withWorkspaceContext(db, { userId, workspaceId }, fn)` sets `set_config('app.current_user_id', $1, true)` and `set_config('app.current_workspace_id', $1, true)` per transaction.
- Forbidden to query a tenant table outside `withWorkspaceContext`.

## 11. Migrations
- Filename `^\d{4}__[a-z0-9_]+\.sql$`.
- BEGIN/COMMIT + idempotent operators required.
- **Migration ranges (revised post-implementation — D-012):** Phase 01 introduces no migrations (architecture-only). Phase 02 = 0001–0118. Phase 03 = 0119–0147. Phase 04 = 0148–0199 (used 0148–0157). Phase 05 = 0200–0299 (used 0200–0204). **From Phase 06 onward, every phase reserves a strict 100-slot range:** Phase NN range = `((NN−6)×100 + 300) .. ((NN−6)×100 + 399)`. Examples: Phase 06 = 0300–0399, Phase 07 = 0400–0499, …, Phase 60 = 5700–5799. The migration runner (`scripts/migrate.ts`) MUST validate that any migration file with prefix outside the active phase's reserved range fails CI. The earlier promise of `0001–0099/0100–0199/0200–0299/0300–0399/none` is superseded by this rule.

## 12. RLS
- ENABLE + FORCE on every tenant table.
- One policy `<table>_isolation`.
- pgTAP test per policy.

## 13. SQL location
- SQL is forbidden in route handlers.
- All queries live in `*.repo.ts`.
- `SELECT *` is forbidden.

## 14. Permissions
- All decisions through `@lifeos/permissions/resolver.assertCapability`.

## 15. AI calls
- Only inside `@lifeos/ai` (created in Phase 06).

## 16. Vault
- Plaintext forbidden in AI prompts / logs / IndexedDB / SW cache / error metadata / audit payloads.
- Crosses boundary only via `@lifeos/vault-crypto`.

## 17. Secrets
- `process.env.X` forbidden outside `@lifeos/shared/env`.

- console.* is forbidden except in logger.ts and scripts/* (enforced by ESLint).

## 18. Naming
Tables snake_case plural; columns snake_case; indexes `idx_<table>_<cols>`; PK/FK/UQ/CHK named; TS types PascalCase; vars camelCase; constants UPPER_SNAKE; files kebab-case; routes `/api/v1/<plural>`; error codes `<DOMAIN>_<REASON>`.

## 19. Branches & Tags (cross-phase consistency)
- **Branch per phase:** `phase/NN-short-name`. Created at the start of the phase, deleted after merge.
- **Exit tag per phase:** annotated git tag `phase-NN-locked` created at end of phase (Phase 00 uses `phase-00-product-contract-locked`).
- **Tag command (binding):** `git tag -a phase-NN-locked -m "<summary>"; git push origin phase-NN-locked`
- **Preflight gate of phase NN+1:** `git tag --list | grep -x phase-NN-locked` (or `phase-00-product-contract-locked` for Phase 01) MUST exit 0.
- **Forbidden:** lightweight tags (`git tag <name>` without `-a`), tag deletion after push, retroactive re-tagging.

## 20. Inter-phase output contract
Every phase MUST end with `docs/execution/phase-NN-outputs.md` containing (template in Step 24 of Phase 00):
1. Guaranteed files / packages / scripts produced.
2. Guaranteed git tag(s) created.
3. Guaranteed env vars introduced (referencing `.env.example`).
4. Guaranteed migration range used (if any).
5. Stubs left behind that the next phase must replace.
6. Open risks carried forward.

## 21. Secrets management protocol (binding from Phase 01 onward)
- **Source of truth for local dev:** `.env.local` (gitignored). Created from `.env.example`.
- **Source of truth for CI:** GitHub Actions repository secrets, one secret per variable.
- **Source of truth for production:** the deploy platform's secret manager (Vercel/Render/Fly env). One secret per variable.
- **Forbidden:** committing `.env` or `.env.local`; storing secrets in Notion; hardcoding secrets in code or docs; checking `process.env.X` outside `@lifeos/shared/env`.
- **Required file per phase that introduces a secret:** add the row to `.env.example` and to the phase's `phase-NN-outputs.md` under "env required".
- **Required for production launch (Phase 60):** a documented secret rotation runbook in `docs/runbooks/secret-rotation.md`.

## 22. Rollback protocol (binding from Phase 02 onward)
- Every migration MUST be paired with a documented manual rollback note in the same file footer (`-- ROLLBACK: ...`).
- Every deploy MUST be reversible via re-deploying the previous git tag.
- A full rollback runbook lives at `docs/runbooks/rollback.md` (introduced in Phase 01) and is updated whenever a new external system (storage, push, AI provider) is added.
