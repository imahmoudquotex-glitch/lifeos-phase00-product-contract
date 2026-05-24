# ADR 0004 — Errors, Result, and Time Exceptions

- Status: Accepted
- Date: 2024-01-01
- Owner: Backend/DX

## Context
Three categories of cross-cutting conventions required a single authoritative decision:

1. **Error taxonomy** — where `AppError` and `ErrorCode` live and how many copies may exist.
2. **Result type** — whether to use a Railway-Oriented (Result<T, E>) pattern or throw everywhere.
3. **Clock abstraction** — how to ensure time-related code is testable and timezone-safe.

## Decision

### 1. Errors — Single Source of Truth

`AppError`, `ErrorCode`, `Result<T>`, `ok`, `err`, `isOk`, `isErr` exist **exactly once** at:

```
packages/shared/src/errors/app-error.ts   ← class AppError
packages/shared/src/errors/codes.ts       ← type ErrorCode
packages/shared/src/errors/result.ts      ← Result<T>, ok, err, isOk, isErr
packages/shared/src/errors/index.ts       ← barrel re-export
```

`@lifeos/result` is a **thin façade** that re-exports from `@lifeos/shared/errors`. It contains zero new definitions.

Any `class AppError` outside `packages/shared/src/errors/app-error.ts` is a **CI failure**.

### 2. API Envelope — Single Source of Truth

The API envelope shape and `STATUS_MAP` live in `packages/shared/src/envelope/envelope.ts`:

```typescript
// Success
{ ok: true, data: T, meta?: Record<string, unknown> }

// Failure
{ ok: false, error: { code: string, message: string, metadata?: Record<string, unknown> } }
```

`STATUS_MAP: Partial<Record<ErrorCode, number>>` maps every `ErrorCode` to its HTTP status.
Route adapters call `statusForError(e)` — they **never** inline status logic.

### 3. Clock — All `new Date()` through abstraction

The rule: **no `new Date()` outside `@lifeos/shared/time`**.

```typescript
// ✅ allowed
import { systemClock } from '@lifeos/shared/time';
const ts = systemClock.nowIso();

// ❌ forbidden
const ts = new Date().toISOString();
```

This enables:
- Deterministic tests via `fixedClock('2024-01-01T00:00:00.000Z')`.
- No timezone surprises — `nowIso()` always returns UTC ISO 8601.

#### Documented exceptions to the Clock rule

There are **exactly two** locations allowed to call `new Date()` directly:

1. `packages/shared/src/time/clock.ts` — the Clock implementation itself (obviously required).
2. `packages/shared/src/logger/logger.ts` — the logger emits a wall-clock timestamp at log-line construction time. It must work **before any DI container or Clock instance exists** (e.g., during server bootstrap and inside error handlers). It is intentionally untestable for time and never participates in business logic.

Any third exception requires a **new ADR**.

## Consequences

- `scripts/check-no-duplicate-app-error.ts` fails CI on any `class AppError` duplicate.
- `scripts/check-timezone-hardcode.ts` scans for `new Date(` outside the two allowed files.
- `@lifeos/result` imports verify façade pattern in code review.
- All route handlers use `envelopeOk()` / `envelopeErr()` / `statusForError()` — never raw `{ ok: false }` literals.

## Enforcement
- `scripts/check-no-duplicate-app-error.ts` (CI, Phase 01+).
- `scripts/check-timezone-hardcode.ts` excludes only `packages/shared/src/time/` and `packages/shared/src/logger/` (CI, Phase 01+).
- `scripts/check-routes-envelope.ts` (activates Phase 02 — verifies all route.ts files use `envelopeOk`/`envelopeErr`).
