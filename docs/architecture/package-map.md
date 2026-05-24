# Package Map — LifeOS

> Single source of truth for all packages, their dependencies, owners, and activation phases.

## `packages/shared` — @lifeos/shared

**Owner:** DX  
**Phase introduced:** 01  
**Runtime dependencies:** none (zero external deps, pure TypeScript)  
**Dev dependencies:** vitest

### Modules

| Sub-path | File | Exports |
|---|---|---|
| `@lifeos/shared/ids` | `src/ids/newUlid.ts` | `newUlid(now?)` |
| `@lifeos/shared/time` | `src/time/clock.ts` | `Clock`, `systemClock`, `fixedClock` |
| `@lifeos/shared/money` | `src/money/money.ts` | `Money`, `money()`, `addMoney()` |
| `@lifeos/shared/errors` | `src/errors/index.ts` | `ErrorCode`, `AppError`, `Result<T>`, `ok`, `err`, `isOk`, `isErr` |
| `@lifeos/shared/envelope` | `src/envelope/envelope.ts` | `ApiEnvelope<T>`, `STATUS_MAP`, `statusForError`, `envelopeOk`, `envelopeErr` |
| `@lifeos/shared/pagination` | `src/pagination/cursor.ts` | `Cursor`, `defaultCursor`, `encodeCursor`, `decodeCursor` |
| `@lifeos/shared/env` | `src/env/server-env.ts` | `ServerEnv`, `getServerEnv()`, `resetServerEnvCache()` |
| `@lifeos/shared/logger` | `src/logger/logger.ts` | `Logger`, `consoleLogger` |

### Rules
- Zero runtime dependencies (no npm packages in `dependencies`).
- Zero `new Date()` outside `src/time/clock.ts` and `src/logger/logger.ts` (ADR 0004).
- Zero `class AppError` duplicates anywhere else (ADR 0004).

---

## `packages/result` — @lifeos/result

**Owner:** DX  
**Phase introduced:** 01  
**Runtime dependencies:** `@lifeos/shared` (workspace:*)

### Purpose
Thin façade for consumers that want a short import path (`@lifeos/result`) without repeating the full `@lifeos/shared/errors` path.

### Rules
- `src/index.ts` contains ONLY re-exports. No new definitions. EVER.
- Adding a `class AppError` here breaks `check-no-duplicate-app-error.ts`.

---

## `packages/db` — @lifeos/db

**Owner:** Backend  
**Phase introduced:** 01  
**Runtime dependencies:** `@lifeos/shared` (workspace:*), `postgres` (npm ^3.4.4)

### Exports

| Export | File | Description |
|---|---|---|
| `DbClient` | `src/client.ts` | Interface: `one/oneOrNone/many/none/tx` |
| `getDb` | `src/postgres-adapter.ts` | Singleton factory (only call once per process) |
| `withWorkspaceContext` | `src/tx-context.ts` | RLS GUC setup per transaction |

### Rules
- Only `postgres-adapter.ts` may `import postgres from 'postgres'`.
- No other package imports the `postgres` npm package.
- `getDb()` is a singleton — call once at boot, inject `DbClient` everywhere else.

---

## `packages/route` — @lifeos/route

**Owner:** Backend  
**Phase introduced:** 01  
**Runtime dependencies:** `@lifeos/shared` (workspace:*), `zod` (npm ^3.23.0)

### Exports

| Export | File | Description |
|---|---|---|
| `withApiErrorHandling` | `src/withApiErrorHandling.ts` | Catch-all error→envelope wrapper |
| `withUserRoute` | `src/withUserRoute.ts` | **Stub** — throws `AUTH_REQUIRED` until Phase 05 |
| `withWorkspaceRoute` | `src/withWorkspaceRoute.ts` | **Stub** — throws `AUTH_REQUIRED` until Phase 02+05 |
| `parseJsonBody` | `src/parseJsonBody.ts` | Zod-validated JSON body parser |
| `requireIdempotencyKey` | `src/requireIdempotencyKey.ts` | Header guard for mutation routes |

### Rules
- No SQL in route files.
- All errors surface via `envelopeErr` + `statusForError` from `@lifeos/shared`.
- `withUserRoute` and `withWorkspaceRoute` MUST stay as stubs until their respective phases activate them.

---

## `apps/web` — @lifeos/app-web

**Owner:** Frontend  
**Phase introduced:** 01  
**Runtime dependencies:** `next`, `react`, `react-dom`, `@lifeos/shared`, `@lifeos/route`

### Phase 01 routes
| Route | Handler | Status |
|---|---|---|
| `GET /api/health` | `app/api/health/route.ts` | Live — returns `{ ok: true, data: { status: 'ok', phase: '01' } }` |

All other routes are Phase 02+.

---

## `apps/worker` — @lifeos/app-worker

**Owner:** Backend  
**Phase introduced:** 01 (stub)  
**Runtime dependencies:** `@lifeos/shared`

### Phase 01
Placeholder boot script. Logs `worker_boot` and exits. Full implementation in Phase 04.

---

## Inter-Package Dependency Graph

```
@lifeos/app-web ──────────────→ @lifeos/shared
                └─────────────→ @lifeos/route ──→ @lifeos/shared
@lifeos/app-worker ───────────→ @lifeos/shared
@lifeos/db ───────────────────→ @lifeos/shared
@lifeos/route ────────────────→ @lifeos/shared
@lifeos/result ───────────────→ @lifeos/shared (re-export only)
```

**Rule:** No circular dependencies. No inter-app imports (`apps/web` must not import `apps/worker`).
