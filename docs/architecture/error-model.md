# Error Model — LifeOS

> How `AppError`, `Result<T>`, and the API Envelope work together.

## 1. Primitive: `AppError`

```typescript
// packages/shared/src/errors/app-error.ts  ← ONLY location
class AppError extends Error {
  readonly code: ErrorCode | string;
  readonly metadata?: Record<string, unknown>;
  constructor(code, message?, metadata?) { ... }
}
```

**Rules:**
- `name` is always `'AppError'` for reliable `instanceof` checks.
- `code` is one of the typed `ErrorCode` values (preferred) or a free-form string (for domain errors introduced per-phase).
- `metadata` carries machine-readable context (e.g., `{ field: 'email', value: '...' }`).
- There is **exactly one** `class AppError` in the entire monorepo. `check-no-duplicate-app-error.ts` enforces this in CI.

## 2. `ErrorCode` Taxonomy

```typescript
type ErrorCode =
  | 'UNKNOWN'                  // catch-all
  | 'ENV_MISSING'              // required env var absent at boot
  | 'AUTH_REQUIRED'            // no session / not authenticated
  | 'AUTH_FORBIDDEN'           // authenticated but insufficient privilege
  | 'VALIDATION_FAILED'        // schema mismatch, bad input
  | 'NOT_FOUND'                // resource does not exist
  | 'CONFLICT'                 // uniqueness or state conflict
  | 'RATE_LIMIT'               // too many requests
  | 'IDEMPOTENCY_REQUIRED'     // Idempotency-Key header missing
  | 'IDEMPOTENCY_REPLAY'       // key already used, replaying prior response
  | 'MONEY_INVALID_CURRENCY'   // not a 3-letter ISO-4217 code
  | 'MONEY_CURRENCY_MISMATCH'  // arithmetic across different currencies
  | 'DB_TRANSIENT'             // retryable DB error
  | 'DB_CONSTRAINT'            // unique/FK violation
  | 'DB_EXPECTED_ONE'          // DbClient.one() got != 1 row
  | 'DB_EXPECTED_ONE_OR_NONE'; // DbClient.oneOrNone() got > 1 row
```

Phase 02+ may introduce domain-specific codes (e.g., `WORKSPACE_QUOTA_EXCEEDED`). Each new code must appear in `codes.ts` and be mapped in `STATUS_MAP`.

## 3. `Result<T>` Pattern

```typescript
type Result<T> = Ok<T> | Err;
type Ok<T>    = { ok: true;  value: T      };
type Err      = { ok: false; error: AppError };
```

### When to use Result vs throw

| Scenario | Use |
|---|---|
| Expected domain failure (not found, validation) | `Result<T>` (caller handles both branches) |
| Truly exceptional condition (env missing, DB down) | `throw new AppError(...)` |
| Route boundary (always) | `withApiErrorHandling` catches throws and converts to envelope |

```typescript
// Repository function (returns Result)
async function getWorkspace(id: string): Promise<Result<Workspace>> {
  const row = await db.oneOrNone<WorkspaceRow>('SELECT ...', [id]);
  if (!row) return err(new AppError('NOT_FOUND', `workspace ${id} not found`));
  return ok(mapRow(row));
}

// Route handler (calls repository)
export const GET = withApiErrorHandling(async (req) => {
  const result = await getWorkspace(id);
  if (isErr(result)) throw result.error;   // or return 404 envelope directly
  return Response.json(envelopeOk(result.value));
});
```

## 4. API Envelope

Every route returns one of two shapes:

```typescript
// Success
{ ok: true, data: T, meta?: Record<string, unknown> }

// Failure
{ ok: false, error: { code: string, message: string, metadata?: Record<string, unknown> } }
```

### HTTP Status Mapping (`STATUS_MAP`)

| ErrorCode | HTTP Status |
|---|---|
| `AUTH_REQUIRED` | 401 |
| `AUTH_FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `CONFLICT` | 409 |
| `IDEMPOTENCY_REPLAY` | 409 |
| `DB_CONSTRAINT` | 409 |
| `IDEMPOTENCY_REQUIRED` | 428 |
| `VALIDATION_FAILED` | 422 |
| `MONEY_INVALID_CURRENCY` | 422 |
| `MONEY_CURRENCY_MISMATCH` | 422 |
| `RATE_LIMIT` | 429 |
| `DB_EXPECTED_ONE` | 500 |
| `DB_EXPECTED_ONE_OR_NONE` | 500 |
| `ENV_MISSING` | 500 |
| `UNKNOWN` | 500 |
| `DB_TRANSIENT` | 503 |

## 5. Error Flow (end-to-end)

```
Business logic throws AppError('NOT_FOUND')
   ↓
withApiErrorHandling catches it
   ↓
envelopeErr(e)  →  { ok: false, error: { code: 'NOT_FOUND', message: '...' } }
statusForError(e)  →  404
   ↓
Response.json(envelope, { status: 404 })
```

## 6. Anti-patterns

```typescript
// ❌ never return raw error objects from routes
return Response.json({ error: 'not found' }, { status: 404 });

// ❌ never duplicate AppError
class AppError extends Error { ... }  // in packages/foo — breaks CI

// ❌ never inline status logic
const status = code === 'NOT_FOUND' ? 404 : 500;  // use statusForError()
```
