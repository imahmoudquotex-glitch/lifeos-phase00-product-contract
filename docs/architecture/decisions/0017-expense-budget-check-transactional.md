# ADR 0017 — Expense Budget Check: Transactional FOR UPDATE

## Status
Accepted

## Context
Checking a budget and then inserting an expense in two separate queries is a TOCTOU race condition. Two concurrent requests could both pass the budget check and collectively exceed the monthly limit.

## Decision
`ExpenseRepo.createWithBudgetCheck` runs inside `db.tx()`:

1. `SELECT ... FROM budgets WHERE workspace_id=$1 AND category=$2 FOR UPDATE` — locks the budget row
2. `SELECT SUM(amount_cents) FROM expenses WHERE workspace_id=$1 AND category=$2 AND spent_at >= month_start AND is_deleted = false` — current month total
3. Compare `total + newAmount` vs `monthly_limit_cents` → throw `BUDGET_EXCEEDED` if exceeded
4. `INSERT INTO expenses ...` — under the same transaction

No budget row → no limit enforced (budgets are optional per category).

## Consequences
- ✅ Race-free budget enforcement
- ✅ Atomic check-and-insert
- ❌ Budget row serialization means concurrent expense creation for same workspace+category is sequential
- This is acceptable at current scale; can be relaxed via optimistic locking in a later phase
- ❌ Budget check only covers current calendar month; historical months not re-checked
