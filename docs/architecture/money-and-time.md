# Money and Time — LifeOS

> Rules for monetary values and clock abstraction.

## Part A — Money

### 1. Why Integer Cents?

Floating-point arithmetic is **forbidden** for monetary values. `0.1 + 0.2 === 0.30000000000000004` in JavaScript/IEEE-754. LifeOS stores money as **integer cents** using `bigint`.

| Approach | Problem |
|---|---|
| `float` / `number` | Floating-point rounding errors |
| `string` | Requires parse+validate on every operation |
| `Decimal.js` library | Runtime dependency; overkill for cents |
| `bigint` (cents) | ✅ Exact, no rounding, native JS |

### 2. The `Money` Type

```typescript
interface Money {
  cents: bigint;   // integer cents (e.g., 1099 = $10.99)
  currency: string; // ISO 4217 3-letter code, uppercase (e.g., 'USD', 'EUR')
}

// Factory — validates currency code length
money(1099, 'USD')  // ✅ → { cents: 1099n, currency: 'USD' }
money(1099, 'US')   // ❌ throws AppError('MONEY_INVALID_CURRENCY')

// Arithmetic — only same-currency
addMoney(money(100, 'USD'), money(50, 'USD'))  // ✅ → { cents: 150n, currency: 'USD' }
addMoney(money(100, 'USD'), money(50, 'EUR'))  // ❌ throws AppError('MONEY_CURRENCY_MISMATCH')
```

### 3. Database Storage

All monetary columns follow this pattern:
```sql
amount_cents  BIGINT NOT NULL,                -- integer cents, always
currency      VARCHAR(3) NOT NULL DEFAULT 'USD',  -- ISO 4217 uppercase
```

**Never** use `NUMERIC(12,2)` or `FLOAT` for monetary values. `check-money-columns.ts` (activates Phase 02) will enforce `BIGINT` for `*_cents` columns.

### 4. Display Layer

The display layer (Phase 05+) converts cents to formatted strings:
```typescript
// display only — never stored
const formatted = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: m.currency
}).format(Number(m.cents) / 100);
// Result: "$10.99"
```

Note: `Number(bigint)` is safe for display when cents < `Number.MAX_SAFE_INTEGER` (≈ $90 trillion).

### 5. Anti-patterns

```typescript
// ❌ floating-point money
const price = 10.99;  // never store/compute money as float

// ❌ wrong DB column type
amount NUMERIC(12,2)  -- use BIGINT

// ❌ math on currency string
const total = amount1.currency + amount2.currency;  // meaningless
```

---

## Part B — Time and Clock

### 1. Why Clock Abstraction?

`new Date()` hardcodes the system clock, making time-dependent code untestable. The Clock interface enables:
- **Deterministic tests** via `fixedClock('2024-01-01T00:00:00.000Z')`.
- **UTC enforcement** — `nowIso()` always returns UTC ISO 8601.
- **No timezone bugs** — business logic never formats dates into local time.

### 2. The `Clock` Interface

```typescript
interface Clock {
  nowMs(): number;    // Unix timestamp in milliseconds
  nowIso(): string;   // UTC ISO 8601: '2024-01-01T00:00:00.000Z'
}

// Production use
import { systemClock } from '@lifeos/shared/time';
const ts = systemClock.nowIso();

// Test use
import { fixedClock } from '@lifeos/shared/time';
const clock = fixedClock('2024-01-01T00:00:00.000Z');
const ts = clock.nowIso(); // deterministic: '2024-01-01T00:00:00.000Z'
```

### 3. The Two Allowed `new Date()` Locations (ADR 0004)

The rule "no `new Date()` outside `@lifeos/shared/time`" has exactly **two** documented exceptions:

1. **`packages/shared/src/time/clock.ts`** — the Clock implementation itself.
2. **`packages/shared/src/logger/logger.ts`** — must emit timestamps during bootstrap before DI is available.

`check-timezone-hardcode.ts` enforces this in CI. Any third exception requires a new ADR.

### 4. Database Storage

```sql
-- All timestamps stored as UTC
created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
```

`TIMESTAMPTZ` stores UTC internally regardless of session timezone. Application code always passes UTC strings — never local time.

### 5. ULID Time Component

`newUlid()` uses `Date.now()` (milliseconds since Unix epoch, UTC) for the time prefix. This is correct and consistent with the Clock convention because `Date.now()` is always UTC.

### 6. Anti-patterns

```typescript
// ❌ local time — timezone bug
new Date().toLocaleDateString()

// ❌ manual date math — use Clock
const tomorrow = new Date(Date.now() + 86400000);

// ❌ string format without UTC
new Date().toISOString()  // allowed ONLY inside clock.ts / logger.ts

// ❌ DB: store as TEXT
created_at TEXT  -- use TIMESTAMPTZ
```
