# ADR 0003 — DB Client Interface

- Status: Accepted
- Date: 2024-01-01
- Owner: Backend

## Context
Direct use of database drivers (`pg`, `pg-promise`, `prisma`, raw `postgres.unsafe`) throughout business code creates:
- Vendor lock-in at the point of every query.
- Inconsistent error semantics — some throw, some return `null`, some use callbacks.
- Difficult mocking in unit tests (must stub the entire driver API surface).
- RLS (Row Level Security) cannot be applied uniformly unless all queries go through a single chokepoint that sets GUC variables per transaction.

## Decision
The **only** DB API available in LifeOS business code is the `DbClient` interface:

```typescript
interface DbClient {
  one<T>(sql: string, params?: unknown[]): Promise<T>;
  oneOrNone<T>(sql: string, params?: unknown[]): Promise<T | null>;
  many<T>(sql: string, params?: unknown[]): Promise<T[]>;
  none(sql: string, params?: unknown[]): Promise<void>;
  tx<T>(fn: (tx: DbClient) => Promise<T>): Promise<T>;
}
```

### Semantics
| Method | Returns | Throws if |
|---|---|---|
| `one` | `T` | row count ≠ 1 → `DB_EXPECTED_ONE` |
| `oneOrNone` | `T \| null` | row count > 1 → `DB_EXPECTED_ONE_OR_NONE` |
| `many` | `T[]` | never (empty = `[]`) |
| `none` | `void` | driver error |
| `tx` | `T` | fn throws or driver error |

Implementation: `@lifeos/db/postgres-adapter.ts` over the `postgres` npm package (v3).

### RLS integration
`withWorkspaceContext(db, { userId, workspaceId }, fn)` wraps every multi-tenant operation in a transaction that sets `app.current_user_id` and `app.current_workspace_id` via `set_config($1, true)` (transaction-scoped). PostgreSQL RLS policies read these via `current_setting()`. This pattern is mandatory from Phase 02 onward for all tables with RLS.

## Forbidden patterns

```typescript
// ❌ forbidden — breaks interface contract
import { Pool } from 'pg';
import pgp from 'pg-promise';
import { PrismaClient } from '@prisma/client';
import sql from 'postgres';        // only allowed inside @lifeos/db
await sql.unsafe('SELECT ...');   // only inside postgres-adapter.ts
```

## Alternatives Considered
- **pg-promise** — bigger API surface (tagging, formatting, formatting helpers), harder to mock, no clean transaction-scoped GUC support.
- **Prisma** — ORM lock-in, generated client changes schema control, less control over RLS GUCs, incompatible with Phase 02 raw migration strategy.
- **raw `pg`** — too low-level; every repo would handle pooling, errors, and RLS independently.
- **Drizzle ORM** — promising but Phase 01 does not require an ORM; raw parameterized queries via DbClient are sufficient for Phase 01–04.

## Consequences
- Driver is swappable (replace `postgres` with any other driver) by changing only `postgres-adapter.ts`.
- Uniform `AppError` semantics for all query failures across all repos.
- Easy mocking: `const mockDb: DbClient = { one: vi.fn(), ... }`.
- `scripts/check-naming.ts` does not enforce this; use `import-policy` (manual code review) until a dedicated guard is added in Phase 04.

## Enforcement
- Code review: `packages/*/src/**` must not import `pg`, `pg-promise`, or `postgres` directly.
- `scripts/check-no-sql-in-routes.ts` catches SQL strings leaked into route handlers.
- ADR 0003 is the blocker for any PR that introduces a direct driver import.
