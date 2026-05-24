# Phase 03 — Decisions Log

## D-035 — packages/repo introduced as shared BaseRepo abstraction

**Context**: Each domain service needed common CRUD + pagination patterns. Copy-pasting per service was rejected.  
**Decision**: Introduce `packages/repo` with `BaseRepo<T>` abstract class providing `findById`, `findAll`, `insert`, `update`, `delete` with built-in cursor-based pagination. All domain repos extend BaseRepo.  
**Trade-off**: BaseRepo adds an indirection layer. Accepted because it enforces ADR 0014 (no SELECT *) at a single point.  
**ADR**: 0014.

---

## D-036 — Money stored as BIGINT cents (no DECIMAL/FLOAT)

**Context**: Expense and budget values require exact arithmetic. FLOAT/DECIMAL in application code causes rounding errors at scale.  
**Decision**: All monetary values stored as `BIGINT NOT NULL` representing minor units (cents for USD, pence for GBP, etc.). Application layer divides by 100 for display. Currency code stored as `CHAR(3)` per ISO 4217.  
**Trade-off**: Display logic must always know the currency's minor unit exponent. Accepted — this is a one-time implementation cost vs. permanent data integrity.  
**ADR**: 0010.

---

## D-037 — AI quota enforcement via race-free PostgreSQL RPC

**Context**: `reserve_ai_usage(workspace_id, requested_tokens)` must be atomic. Two concurrent LLM calls for the same workspace could both read the current usage as "under limit" and both proceed, exceeding the quota.  
**Decision**: Implement `reserve_ai_usage` as a PostgreSQL function using `SELECT ... FOR UPDATE` on the workspace row (or a dedicated `ai_usage_buckets` row). The function increments usage atomically and returns `true` (success) or `false` (quota exceeded) in a single statement. App code calls the RPC and checks the result before dispatching to the LLM provider.  
**Trade-off**: Serializes concurrent AI calls per workspace. Acceptable because LLM calls are expensive — serialization at the quota-check level is correct behavior.  
**ADR**: 0011.

---

## D-038 — Note version-based optimistic concurrency (no pessimistic lock)

**Context**: Multiple clients editing the same note concurrently. Pessimistic SELECT FOR UPDATE would block all readers.  
**Decision**: `notes` table has a `version INTEGER NOT NULL DEFAULT 0` column. `updateWithVersion(id, version, patch)` does `UPDATE notes SET version = version + 1, ... WHERE id = $1 AND version = $2`. Returns:
- `Note` — success (version incremented)
- `'CONFLICT'` — version mismatch (another write won)
- `null` — note not found

Client receives `'CONFLICT'` and must re-fetch before retrying.  
**Trade-off**: Client must handle the conflict case. Acceptable — UI can show "document updated, please review changes".  
**ADR**: 0012.

---

## D-039 — Vault stores metadata in DB, ciphertext in DB (Phase 03), key material only in env

**Context**: vault_items contain sensitive user data that must be encrypted at rest. Phase 03 creates the metadata schema; encryption wiring deferred to Phase 04 (`@noble/ciphers`).  
**Decision**: `vault_items_metadata` table stores item type, name, workspace_id, user_id, created_at. The `ciphertext` column exists as `BYTEA` but is NOT populated until Phase 04. RLS policy requires BOTH `app.current_workspace_id` AND `app.current_user_id` (personal vault — not shared across workspace members unless explicitly shared).  
**Trade-off**: Phase 03 is incomplete for vault — encryption is non-functional. Acceptable as a schema-first approach; vault routes will return `NOT_IMPLEMENTED` until Phase 04.  
**ADR**: 0013.

---

## D-040 — BaseRepo enforces no SELECT * via TypeScript types

**Context**: ADR 0014 forbids SELECT * to prevent accidental exposure of sensitive columns (password_hash, session tokens, etc.).  
**Decision**: `BaseRepo<T>` generic requires callers to pass a `columns: (keyof T)[]` array. The base class builds the SELECT clause from this whitelist. Any attempt to pass `['*']` throws at runtime. TypeScript types make the columns array type-safe.  
**Trade-off**: Boilerplate per repo. Accepted — explicit columns is a security invariant.  
**ADR**: 0014.

---

## D-041 — Actor type introduced in permissions package (UserActor + SystemActor)

**Context**: Domain services need to know WHO is performing an action for audit log entries. Passing raw `userId: string` everywhere loses the discriminated union of user vs. system actors.  
**Decision**: `packages/permissions/src/actor.ts` exports `Actor = UserActor | SystemActor`. `UserActor` carries `{ kind: 'user', userId, workspaceId, role, delegatedBy? }`. `SystemActor` carries `{ kind: 'system', systemId, workspaceId }`. Factory functions `actorFromSession` and `actorFromSystem` build actors from session and system contexts respectively.  
**Trade-off**: All service functions must accept `actor: Actor` instead of bare strings. Migration cost accepted for auditability.  
**ADR**: 0015.

---

## D-042 — workspace monthly_ai_token_limit in workspaces table

**Context**: Each workspace needs a configurable AI token quota that reset monthly.  
**Decision**: `ALTER TABLE workspaces ADD COLUMN monthly_ai_token_limit BIGINT NOT NULL DEFAULT 100000` added in `0119__profiles_extensions.sql` alongside other workspace capability fields. The `reserve_ai_usage` RPC reads this column.  
**Trade-off**: Coupling workspace table to AI feature. Acceptable in monolith phase; extract to separate table if workspaces table grows beyond 15 columns.  
**ADR**: 0016.

---

## D-043 — Expense budget check transactional (SELECT FOR UPDATE on budget row)

**Context**: Adding an expense that would exceed a budget requires checking the remaining budget and inserting the expense atomically. Two concurrent expense inserts for the same budget could both pass the check.  
**Decision**: `createWithBudgetCheck` does `SELECT ... FROM budgets WHERE id = $budgetId FOR UPDATE` in the same transaction as the INSERT. This serializes writes to the same budget. Returns `null` if budget exceeded.  
**Trade-off**: Budget writes are serialized per budget row. Acceptable — budgets are per-workspace and concurrent spend on the same budget is an edge case.  
**ADR**: 0017.

---

## D-044 — Habit checkin duplicate → HABIT_CHECKIN_DUPLICATE (not 500)

**Context**: The `habit_checkins` table has a UNIQUE constraint on `(habit_id, date)`. A double-submit or duplicate request throws Postgres error code `23505` (unique_violation).  
**Decision**: The habit service catches `error.code === '23505'` and re-throws `AppError('HABIT_CHECKIN_DUPLICATE', ...)`. The API layer maps this to HTTP 409.

---

## D-045 — Webhook nonces prevent replay attacks

**Context**: Outbound webhook calls and inbound webhook event processing both require replay protection.  
**Decision**: `0146__webhook_nonces.sql` creates a `webhook_nonces(nonce TEXT, workspace_id UUID, consumed_at TIMESTAMPTZ)` table with a TTL-based cleanup. Nonces are checked before processing; consumed nonces are retained for 7 days before deletion.

---

## D-046 — Import jobs use a state machine pattern

**Context**: Data imports (CSV, JSON) are long-running and must survive server restarts.  
**Decision**: `import_jobs` table stores `status: 'pending' | 'running' | 'completed' | 'failed'` with `progress_pct` and `error_details`. Worker processes poll `status = 'pending'` with `FOR UPDATE SKIP LOCKED` to pick up jobs without conflict.

---

## D-047 — goals module deferred to Phase 04 [explicit deferral]

**Context**: The MVP_ALLOWED list includes `goals` as a domain module. Phase 03 implements 12 domain services (ai, calendar, expenses, habits, imports, notes, reviews, shares, tasks, vault, webhooks, xp) but NOT goals.  
**Decision**: goals module is deferred to Phase 04. Rationale: goals require tight integration with the tasks, habits, and XP modules — that integration is cleaner after all three are fully wired in Phase 03. A stub `goal.types.ts` is NOT created to avoid false impression of implementation.  
**Action required in Phase 04**: Implement `packages/services/src/goals/` with goal.repo + goal.service + goal.types, and migration `0148__goals.sql`.
