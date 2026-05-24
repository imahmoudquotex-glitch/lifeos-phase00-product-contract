# ADR 0014 — BaseRepo No SELECT *

- Status: Accepted
- Date: 2026-02-01
- Owner: platform team
- Supersedes: —

## Context

The `packages/repo` package introduces `BaseRepo<T>` as a shared abstraction for database queries. All domain repos extend it. A naive base class implementation might use `SELECT *` as a convenience for fetching full rows.

`SELECT *` is dangerous for security-sensitive tables:
- Columns added in future migrations (e.g., `password_hash`, `totp_secret`, `session_token`) are automatically included in ALL queries — including those returning data to external clients.
- Sensitive columns are exposed without any action from the developer who added them.

This is a systemic vulnerability: one schema change silently breaks data isolation for all repos that used `SELECT *`.

## Decision

`BaseRepo<T>` requires an explicit **column allowlist** at construction time:

```typescript
class TaskRepo extends BaseRepo<Task> {
  protected readonly columns = ['id', 'workspace_id', 'title', 'status', 'due_at', 'created_at'] as const;
}
```

The `BaseRepo` implementation builds all SELECT statements from `this.columns`:
```sql
SELECT id, workspace_id, title, status, due_at, created_at
FROM tasks
WHERE ...
```

Attempting to construct a repo without `columns`, or passing `['*']`, throws `AppError('REPO_INVALID_CONFIG', 'BaseRepo requires explicit column allowlist')` at construction time (fail-fast at startup).

TypeScript enforces that `columns` elements match `keyof T` — typos cause compile-time errors.

## Alternatives Considered

- **`SELECT *` with a compile-time schema diff check** — would require generating TypeScript types from the DB schema on every migration. Adds CI complexity. Rejected for Phase 03; consider as enhancement in Phase 06.
- **Per-query column specification** — too verbose; callers forget columns. Rejected in favour of a single declaration per repo.
- **ESLint rule to forbid `SELECT *`** — catches literal `SELECT *` in SQL strings but misses dynamic query builders. Insufficient as sole guard.

## Consequences

- **Positive**: no sensitive column can be accidentally exposed via BaseRepo — any new sensitive column must be explicitly added to the allowlist to appear in responses.
- **Positive**: TypeScript compile-time safety — column names are validated against the type parameter.
- **Positive**: explicit columns improve query performance (PostgreSQL can use index-only scans when all columns are indexed).
- **Negative**: every repo must declare its column list — boilerplate. Accepted given the security benefit.
- **Negative**: when a column is added in a migration, developers must remember to add it to the repo's allowlist if it should be returned. The TypeScript type will still reflect the new column, but the query will silently omit it — which is the SAFE direction of failure (omission, not exposure).
- **CI enforcement**: `base-repo.test.ts` verifies that `new BaseRepo(['*'])` throws, and that a repo with valid columns produces correct SQL.

## Links

- Related code: `packages/repo/src/base-repo.ts`
- Related code: all domain repos in `packages/services/src/*/` extend BaseRepo.
- ADR 0003 (DbClient interface): BaseRepo uses DbClient internally for queries.
