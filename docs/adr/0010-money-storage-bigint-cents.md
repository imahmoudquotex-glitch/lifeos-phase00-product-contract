# ADR 0010 — Money Storage as BIGINT Cents

- Status: Accepted
- Date: 2026-02-01
- Owner: platform team
- Supersedes: —

## Context

The expense and budget features require storing monetary amounts. Three candidate types in PostgreSQL:

1. **FLOAT / DOUBLE PRECISION** — binary floating point; cannot represent 0.1 + 0.2 exactly. Causes cumulative rounding errors in financial summaries.
2. **NUMERIC / DECIMAL** — exact decimal; safe for arithmetic but slower and takes more storage than integer types. Requires specifying precision and scale at schema time.
3. **BIGINT (minor units)** — stores the integer value in the currency's smallest unit (cents for USD). All arithmetic is exact integer arithmetic.

Applications in fintech, banking, and accounting universally prefer integer minor units over floating point.

## Decision

All monetary values are stored as **`BIGINT NOT NULL`** representing the amount in minor currency units (e.g., `$12.99` → `1299`). Currency is stored as a companion **`CHAR(3) NOT NULL`** column per ISO 4217 (e.g., `'USD'`, `'EUR'`).

Display formatting is the responsibility of the UI layer, which divides by `10^exponent` (where `exponent` is 2 for most currencies, 0 for JPY, 3 for KWD, etc.).

Columns affected: `expenses.amount_cents`, `budgets.limit_cents`, `budgets.spent_cents`.

## Alternatives Considered

- **`NUMERIC(19, 4)`** — rejected because NUMERIC arithmetic is slower than BIGINT, and the 4-decimal scale is unnecessarily precise for consumer expense tracking.
- **`FLOAT8`** — rejected outright due to rounding errors in financial arithmetic.
- **String representation** — rejected because it prevents DB-level aggregation (SUM, AVG) without casting.

## Consequences

- **Positive**: all arithmetic (SUM, subtraction for budget remaining) is exact integer math — no rounding surprises.
- **Positive**: BIGINT is 8 bytes — more compact than NUMERIC and indexable with B-tree.
- **Negative**: display logic must know each currency's minor unit exponent. A lookup table or hard-coded map is required in the UI. Accepted — this is a one-time implementation cost.
- **Negative**: amounts above `922,337,203,685,477.07` (BIGINT max / 100) overflow. Acceptable for consumer finance; not a constraint for expense tracking up to hundreds of millions.
- **CI enforcement**: `expense.service.test.ts` verifies round-trip storage without rounding loss.

## Links

- Related migrations: `0129__expenses.sql`, `0130__budgets.sql`
- Related code: `packages/services/src/expenses/expense.types.ts`
- ADR 0017 (expense budget check): budget remaining = `limit_cents - spent_cents` using BIGINT arithmetic.
