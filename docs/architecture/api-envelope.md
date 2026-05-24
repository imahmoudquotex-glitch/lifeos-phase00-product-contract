# API Envelope — LifeOS

> The canonical shape of every HTTP response in the LifeOS API.

## 1. Contract

Every API route returns exactly one of these two shapes:

### Success
```json
{
  "ok": true,
  "data": { ... },
  "meta": { "cursor": "...", "total": 100 }
}
```
`meta` is optional. Omit it for single-resource responses.

### Failure
```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "workspace abc not found",
    "metadata": { "id": "abc" }
  }
}
```
`metadata` is optional. Include it when machine-readable context is useful (e.g., validation field names).

## 2. TypeScript Types

```typescript
// packages/shared/src/envelope/envelope.ts

type ApiSuccess<T> = { ok: true; data: T; meta?: Record<string, unknown> };
type ApiFailure    = { ok: false; error: { code: string; message: string; metadata?: Record<string, unknown> } };
type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;
```

## 3. Helpers

```typescript
// Build a success envelope
envelopeOk({ id: '01ARZ...', name: 'My Workspace' })
// → { ok: true, data: { id: '01ARZ...', name: 'My Workspace' } }

envelopeOk(rows, { cursor: nextCursor })
// → { ok: true, data: rows, meta: { cursor: nextCursor } }

// Build a failure envelope from an AppError
envelopeErr(new AppError('NOT_FOUND', 'workspace not found', { id }))
// → { ok: false, error: { code: 'NOT_FOUND', message: 'workspace not found', metadata: { id } } }
```

## 4. HTTP Status Mapping

`statusForError(e)` is the **single source of truth**. Route adapters never inline status logic.

| Code | Status | Meaning |
|---|---|---|
| `AUTH_REQUIRED` | 401 | Unauthenticated — session missing or expired |
| `AUTH_FORBIDDEN` | 403 | Authenticated but lacks permission |
| `NOT_FOUND` | 404 | Resource does not exist (or is not visible to this user) |
| `CONFLICT` | 409 | Uniqueness violation or state conflict |
| `IDEMPOTENCY_REPLAY` | 409 | Idempotency key already used — replaying prior response |
| `DB_CONSTRAINT` | 409 | PostgreSQL unique/FK constraint violation |
| `IDEMPOTENCY_REQUIRED` | 428 | Mutation route missing `Idempotency-Key` header |
| `VALIDATION_FAILED` | 422 | Request body fails schema validation |
| `MONEY_INVALID_CURRENCY` | 422 | Currency code is not valid ISO-4217 |
| `MONEY_CURRENCY_MISMATCH` | 422 | Cannot perform arithmetic across currencies |
| `RATE_LIMIT` | 429 | Too many requests |
| `DB_EXPECTED_ONE` | 500 | Bug: `DbClient.one()` received != 1 row |
| `DB_EXPECTED_ONE_OR_NONE` | 500 | Bug: `DbClient.oneOrNone()` received > 1 row |
| `ENV_MISSING` | 500 | Required environment variable absent at boot |
| `UNKNOWN` | 500 | Unclassified error |
| `DB_TRANSIENT` | 503 | Transient DB error — safe to retry |

## 5. Usage in Route Handlers

```typescript
// apps/web/app/api/v1/workspaces/route.ts

import { envelopeOk } from '@lifeos/shared';
import { withWorkspaceRoute } from '@lifeos/route';

export const GET = withWorkspaceRoute(async (req, { userId, workspaceId }) => {
  const workspace = await workspaceRepo.get(workspaceId);
  return Response.json(envelopeOk(workspace));
});
```

`withApiErrorHandling` (used internally by `withWorkspaceRoute`) catches any thrown `AppError` and converts it to a failure envelope automatically:

```typescript
// Inside withApiErrorHandling:
try {
  return await handler(req);
} catch (e) {
  return Response.json(envelopeErr(e), { status: statusForError(e) });
}
```

## 6. Idempotency Replay

When a mutation is replayed (same `Idempotency-Key` seen again), the server returns:
```json
HTTP 409
{ "ok": false, "error": { "code": "IDEMPOTENCY_REPLAY", "message": "request already processed" } }
```
The client MUST treat `IDEMPOTENCY_REPLAY` as success (the original response was already committed).

## 7. Pagination Meta

Paginated list responses include cursor in `meta`:
```json
{
  "ok": true,
  "data": [ ... ],
  "meta": { "cursor": "eyJhZnRlciI6IjAxQVJaLi4uIn0", "hasMore": true }
}
```

## 8. Anti-patterns

```typescript
// ❌ raw JSON — never
return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });

// ❌ inline status — never
const status = code === 'NOT_FOUND' ? 404 : 500;

// ❌ mixing ok:true with error — impossible by type but don't try
{ ok: true, error: { ... } }
```
