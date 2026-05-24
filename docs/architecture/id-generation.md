# ID Generation — LifeOS

> Why ULID, how it is generated, and what it looks like.

## 1. Why ULID?

LifeOS uses **ULID** (Universally Unique Lexicographically Sortable Identifier) for all primary keys and public-facing IDs.

| Property | UUID v4 | ULID |
|---|---|---|
| Length | 36 chars (with dashes) | 26 chars |
| Sortable | ❌ random | ✅ monotonically increasing by ms |
| URL-safe | ❌ contains dashes | ✅ Crockford base32 |
| Collision-safe | ✅ | ✅ (80-bit random per ms) |
| DB index friendly | ❌ random UUIDs fragment B-tree | ✅ time-prefixed reduces fragmentation |
| Web Crypto compatible | ✅ | ✅ |

**Key decision:** Sortable IDs mean that `ORDER BY id` gives chronological order without a separate `created_at` index for most queries. This matters at Phase 40+ when tables have millions of rows.

## 2. Format

```
01ARYZ6S41TPTWGY6TTBG7STZR
│─────────────┐│────────────────┐
│ Time (48 bit)│  Random (80 bit)│
│  10 chars    │  16 chars        │
└──────────────┘└────────────────┘

Alphabet: Crockford Base32 = 0123456789ABCDEFGHJKMNPQRSTVWXYZ
Length: 26 characters
```

The alphabet deliberately excludes `I`, `L`, `O`, `U` to avoid visual confusion and profanity.

## 3. Implementation

```typescript
// packages/shared/src/ids/newUlid.ts

export function newUlid(now: number = Date.now()): string {
  return encodeTime(now) + encodeRandom();
}
```

**Critical: uses `globalThis.crypto.getRandomValues`** — the Web Crypto API available natively in:
- Node 20+ (no polyfill needed)
- Browsers (all modern)
- Cloudflare Workers (future target)
- Deno

This means **no `uuid` or `ulid` npm package is needed**. Zero runtime dependency for ID generation.

## 4. Usage Patterns

```typescript
import { newUlid } from '@lifeos/shared';

// Generating a new ID
const workspaceId = newUlid();     // '01ARYZ6S41TPTWGY6TTBG7STZR'

// Deterministic ID for tests (fixed timestamp)
const testId = newUlid(1704067200000);  // fixed to 2024-01-01T00:00:00Z

// DB: always stored as TEXT, never cast to UUID
// PostgreSQL: VARCHAR(26) NOT NULL
// Constraint: CHECK (id ~ '^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$')
```

## 5. Database Storage

- Store as `VARCHAR(26)` or `TEXT` — **not** `UUID`. ULID and UUID have different alphabets; casting breaks.
- Primary key: `id VARCHAR(26) NOT NULL DEFAULT ''` (app-generated, never DB-generated).
- Foreign keys reference the 26-char ULID string.
- Sorting by `id` is equivalent to sorting by insertion order (within the same millisecond, order is random but consistent within a transaction).

## 6. Collision Analysis

Within a single millisecond, the random component provides 2^80 ≈ 1.2 × 10^24 possibilities. Even at 1 million IDs/ms, the collision probability is negligible (< 10^-18).

## 7. Compatibility

- ULID is cross-compatible with UUID storage in PostgreSQL if using `gen_random_uuid()` style. We do NOT mix the two — LifeOS uses ULID exclusively.
- Mobile clients (Phase 05+) will use the same Web Crypto-based generator (React Native has `crypto.getRandomValues` via the `expo-crypto` polyfill or React Native's built-in implementation).

## 8. Anti-patterns

```typescript
// ❌ never use uuid package
import { v4 as uuidv4 } from 'uuid';

// ❌ never let the DB generate the primary key
// id SERIAL or id UUID DEFAULT gen_random_uuid()  ← forbidden in LifeOS tables

// ❌ never use Math.random() for IDs
const id = Math.random().toString(36);
```
