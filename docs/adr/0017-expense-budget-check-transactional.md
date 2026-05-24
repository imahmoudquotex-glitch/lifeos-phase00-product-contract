# ADR 0017 — Expense Budget Check Transactional

- Status: Accepted
- Date: 2026-02-01
- Owner: platform team
- Supersedes: —

## Context

When adding an expense, the system may check whether the expense would exceed a budget limit. This involves two DB operations:

1. **Check**: read the current `spent_cents` of the budget and compare to `limit_cents`.
2. **Record**: insert the new expense row and update `budgets.spent_cents`.

If these operations are not atomic, two concurrent expense inserts against the same budget can both pass the check with stale `spent_cents` values and both proceed — resulting in the budget being exceeded.

Example race:
- Budget limit: 10,000 cents ($100). Current spent: 9,500 cents.
- Request A: adds $8 expense → reads spent = 9,500, 9,500 + 800 = 10,300 > 10,000 → SHOULD reject.
- Request B: adds $4 expense → reads spent = 9,500, 9,500 + 400 = 9,900 ≤ 10,000 → passes.
- Without locking: Request B passes and records expense. Request A (concurrent) also reads 9,500 and INCORRECTLY passes (9,500 + 800 < 10,000 is false, but if spent was 9,000 at read time, it would incorrectly pass).
- Net result: both can exceed the budget depending on timing.

## Decision

`createWithBudgetCheck(actor, expenseInput)` in `expense.service.ts` uses `SELECT ... FOR UPDATE` on the target budget row before inserting the expense:

```sql
-- Step 1: Lock the budget row
SELECT id, limit_cents, spent_cents, workspace_id
FROM budgets
WHERE id = $budgetId AND workspace_id = $workspaceId
FOR UPDATE;

-- Step 2 (conditional): Check remaining budget
-- If limit_cents - spent_cents < requested_amount_cents → return null (rejected)

-- Step 3 (conditional): Insert expense and update spent_cents
INSERT INTO expenses (...) VALUES (...);
UPDATE budgets SET spent_cents = spent_cents + $amount WHERE id = $budgetId;
```

All three steps run inside a single `db.tx()` transaction. The `FOR UPDATE` lock is held from Step 1 until the transaction commits, serializing all concurrent writes to the same budget row.

Return value: `Expense` if created, `null` if budget exceeded.

## Alternatives Considered

- **Application-level check + no locking** — rejected due to TOCTOU race described above.
- **Trigger on expenses table** — rejected because trigger-level budget enforcement requires a trigger for EVERY expense insert, cannot return a typed null (it raises an exception), and doesn't distinguish "budget exceeded" from other errors at the application layer.
- **Optimistic concurrency on budget (version column)** — viable but requires application-level retry on conflict. For budget enforcement, pessimistic locking is more appropriate — the check-and-write must be atomic with no retry loop that could mask sustained overrun.
- **Advisory lock on budget ID** — viable but advisory locks require explicit release and don't compose well with auto-rollback on error. Row-level `FOR UPDATE` is simpler.

## Consequences

- **Positive**: budget enforcement is race-free — concurrent expense inserts against the same budget are serialized at the row lock.
- **Positive**: single transaction — no partial state is visible. If the expense insert fails, the budget `spent_cents` is not updated.
- **Negative**: concurrent expense inserts for the same budget are serialized. In practice, this means one request waits ~1–5ms for the lock. Acceptable for expense tracking (humans don't submit expenses simultaneously at millisecond granularity).
- **Negative**: a long-running transaction holding the budget lock blocks all other writes to that budget. Callers must not hold this transaction open unnecessarily.
- **CI enforcement**: `expense.service.test.ts` uses a test pool with simulated concurrency to verify budget overrun is prevented.

## Links

- Related migration: `0129__expenses.sql`, `0130__budgets.sql`, `0131__expenses_rls.sql`
- Related code: `packages/services/src/expenses/expense.service.ts` (`createWithBudgetCheck`)
- ADR 0010 (money storage): `amount_cents`, `limit_cents`, `spent_cents` are BIGINT.
- ADR 0011 (AI quota RPC): same FOR UPDATE pattern used for AI quota enforcement.
