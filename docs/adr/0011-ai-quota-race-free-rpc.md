# ADR 0011 — AI Quota Race-Free PostgreSQL RPC

- Status: Accepted
- Date: 2026-02-01
- Owner: platform team
- Supersedes: —

## Context

Each workspace has a `monthly_ai_token_limit` (default 100,000 tokens). Before dispatching a request to an LLM provider, the system must check whether the workspace has sufficient remaining quota and, if so, atomically consume the requested amount.

The naive approach — read current usage, compare to limit, then write new usage — has a TOCTOU (time-of-check time-of-use) race condition: two concurrent LLM calls can both pass the check before either records usage, allowing quota overrun.

The LLM call itself is expensive (latency + cost). The check must prevent overrun without introducing unnecessary serialization for workspaces that have ample quota.

## Decision

Implement quota reservation as a single PostgreSQL function `reserve_ai_usage(p_workspace_id UUID, p_tokens BIGINT)` that:

1. Does `SELECT ... FROM ai_usage_buckets WHERE workspace_id = p_workspace_id AND bucket_month = date_trunc('month', now()) FOR UPDATE`.
2. Sums existing usage for the current calendar month.
3. Compares `current_usage + p_tokens` against `workspaces.monthly_ai_token_limit`.
4. If within limit: INSERTs a new `ai_usage_events` row and returns `true`.
5. If exceeded: returns `false` without inserting.

The `FOR UPDATE` lock on the bucket row serializes concurrent reservations for the same workspace within the same month. The lock is held for the duration of the function (a single SQL call from the caller's transaction).

The application calls the RPC before initiating the LLM call:
```sql
SELECT reserve_ai_usage($workspaceId, $estimatedTokens);
```
If it returns `false`, the API returns `AppError('AI_QUOTA_EXCEEDED', ...)`.

## Alternatives Considered

- **Application-level SELECT + INSERT** — rejected due to TOCTOU race: two concurrent requests both read "usage = 80k", both see "under 100k limit", both proceed. Net usage = 100k + 100k = 200k, double the limit.
- **Advisory locks** — viable but coarser than row-level FOR UPDATE. Advisory locks require explicit release and don't compose well with transactions.
- **Optimistic concurrency (version column)** — rejected because conflicts would require retry at the application level, and retrying an LLM call is expensive. Pessimistic locking is correct here.
- **Separate quota microservice** — rejected for Phase 03. Overkill for a monolith; deferred to scaling phase if needed.

## Consequences

- **Positive**: quota enforcement is race-free — no workspace can exceed its monthly limit even under high concurrent load.
- **Positive**: the check-and-record happens in one DB round-trip (SQL function call).
- **Negative**: concurrent AI calls for the same workspace are serialized at the quota-check point. This adds ~1–5ms latency per call under contention. Acceptable — LLM calls themselves take 500ms–30s.
- **Negative**: the `FOR UPDATE` lock is held for the duration of the calling transaction. Callers must not hold this transaction open for a long time (e.g., while the LLM is responding). Pattern: call `reserve_ai_usage` in a short transaction before starting the LLM call.
- **CI enforcement**: `ai-quota.service.test.ts` verifies concurrent calls are correctly serialized using a test pool simulating race conditions.

## Links

- Related migration: `0139__ai_usage_rpcs.sql` (contains the PostgreSQL function)
- Related migrations: `0136__ai_usage_events.sql`, `0137__ai_usage_indexes.sql`, `0138__ai_usage_rls.sql`
- Related code: `packages/services/src/ai/ai.service.ts`
- ADR 0016 (monthly token limit): `monthly_ai_token_limit` column read by this RPC.
