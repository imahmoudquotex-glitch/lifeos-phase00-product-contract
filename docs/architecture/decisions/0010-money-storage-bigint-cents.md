# ADR 0010 — Money Storage: BIGINT Cents

## Status
Accepted

## Context
Monetary values must be stored and computed with exact precision. Floating-point types (FLOAT, DECIMAL, NUMERIC) introduce rounding errors. JavaScript also lacks native decimal arithmetic, and `number` loses precision past 2^53.

## Decision
All monetary columns are stored as `BIGINT` in cents (integer). No `NUMERIC`, `DECIMAL`, or `FLOAT` allowed for money. TypeScript types use `bigint`.

## Examples
- `expenses.amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0)`
- `budgets.monthly_limit_cents BIGINT NOT NULL CHECK (monthly_limit_cents > 0)`

## Consequences
- ✅ No rounding errors
- ✅ BigInt in TypeScript maps cleanly
- ✅ CI guard `check-money-columns.ts` enforces this at CI time
- ❌ Division requires explicit handling (display: `cents / 100`)
- ❌ Currency conversion must happen at application layer with precise arithmetic
