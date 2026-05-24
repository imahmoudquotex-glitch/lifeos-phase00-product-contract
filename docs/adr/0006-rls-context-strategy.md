# ADR 0006 — RLS Context Strategy via Transaction-Scoped GUCs

- Status: Accepted
- Date: 2026-01-12
- Owner: platform team
- Supersedes: —

## Context

PostgreSQL Row-Level Security policies must know the current user and workspace to filter rows correctly. The system has a single Postgres connection pool shared across all concurrent requests. Two sub-problems must be solved:

1. **How to inject per-request identity into SQL** without per-request connection affinity.
2. **How to guarantee the identity is cleared** after the request, even on errors.

Additional constraint: FORCE RLS is enabled on all tenant tables, so even the table owner cannot bypass policies during normal request processing.

## Decision

Inject the current user and workspace via transaction-scoped GUCs using `set_config(name, value, is_local = true)`:

```sql
SELECT set_config('app.current_user_id',    $1, true);
SELECT set_config('app.current_workspace_id', $2, true);
```

`is_local = true` causes the GUC to reset automatically when the transaction ends (commit or rollback). Every tenant query is wrapped in `withWorkspaceContext()` which:
1. Opens a transaction via `db.tx(...)`.
2. Sets both GUCs in the first statement of the transaction.
3. Verifies membership via `SELECT app_is_member($workspaceId)`.
4. Executes the caller's callback inside the same transaction.
5. The transaction closes → GUCs are reset automatically.

## Alternatives Considered

- **Session-level GUCs (`is_local = false`)** — rejected because GUCs would bleed across requests if the connection is reused (pool reuse is the entire point). A missed cleanup would expose user A's data to user B.
- **Separate connection per user** — rejected because it defeats connection pooling and scales poorly beyond ~100 concurrent users.
- **Middleware-level enforcement (application layer only, no RLS)** — rejected because any missing middleware call would expose raw data. RLS at the DB level is the last-resort safety net and is mandatory.
- **Supabase Auth JWT approach** — rejected because the system uses server-side opaque sessions (ADR 0005), not JWTs. Embedding a user claim in every JWT would contradict the session model.

## Consequences

- **Positive**: single enforcement point — impossible to bypass from any code path that uses the standard `DbClient` (every query inside a `withWorkspaceContext` transaction is automatically filtered).
- **Positive**: transaction-scoped reset is implicit — no cleanup code required, no risk of GUC leak between requests.
- **Positive**: membership is verified inside the same transaction, ensuring atomicity between "is member?" and "can read data?".
- **Negative**: every tenant query requires a transaction (even read-only ones). Minor overhead; acceptable for the monolith phase. Optimize with `BEGIN READ ONLY` in Phase 06 if profiling shows impact.
- **Negative**: calling `withWorkspaceContext` twice (nested) will open a nested transaction — the outer one's GUCs override the inner if `is_local` behaves differently across nesting levels. Pattern is forbidden: callers must not call `withWorkspaceContext` inside an existing workspace context.
- **CI enforcement**: `workspace-context.test.ts` verifies GUC injection and membership check. pgTAP RLS isolation tests verify cross-workspace leakage is prevented at the DB layer.

## Links

- Related code: `packages/auth/src/workspace-context.ts`
- Related migrations: `0113__rls_helpers.sql`, `0114__rls_enable_force.sql`, `0115–0117__rls_policies_*.sql`
- ADR 0003 (DbClient interface): `withWorkspaceContext` depends on the `tx()` method.
- ADR 0005 (session storage): session provides `userId` for GUC injection.
