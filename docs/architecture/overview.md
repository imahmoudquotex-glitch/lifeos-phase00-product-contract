# Architecture Overview — LifeOS

> Phase 01 baseline. Updated as each phase adds surfaces.

## System Context

LifeOS is a personal life-management platform (tasks, notes, habits, expenses, calendar, files, AI assistant). It is multi-tenant: each user can belong to one or more **workspaces** and each workspace can have multiple **members** with different roles.

```
┌────────────────────────────────────────────────────────┐
│                     Internet                           │
└────────────────────────────────┬───────────────────────┘
                                 │ HTTPS
                    ┌────────────▼────────────┐
                    │   @lifeos/app-web        │
                    │   Next.js 14 (App Router)│
                    │   /api/v1/**  ← REST     │
                    └────────────┬────────────┘
                                 │ shared packages
          ┌──────────────────────┼──────────────────────┐
          │                      │                       │
 ┌────────▼──────┐  ┌────────────▼──────┐  ┌────────────▼──────┐
 │ @lifeos/shared │  │   @lifeos/db      │  │  @lifeos/route    │
 │ types + utils  │  │   DbClient iface  │  │  API wrappers     │
 └───────────────┘  │   postgres-adapter│  └───────────────────┘
                    └────────────┬──────┘
                                 │ postgres (npm)
                    ┌────────────▼──────────────┐
                    │   PostgreSQL 15+           │
                    │   RLS enabled per table    │
                    └───────────────────────────┘

                    ┌───────────────────────────┐
                    │   @lifeos/app-worker       │
                    │   Background jobs          │
                    │   (Phase 04 activates)     │
                    └───────────────────────────┘
```

## Package Map

| Package | Role | Key exports | Phase |
|---|---|---|---|
| `@lifeos/shared` | Core primitive types | `newUlid`, `Clock`, `Money`, `AppError`, `Result`, `envelopeOk`, `getServerEnv`, `consoleLogger` | 01 |
| `@lifeos/result` | Façade re-export | same as `@lifeos/shared/errors` | 01 |
| `@lifeos/db` | DB contract | `DbClient`, `getDb`, `withWorkspaceContext` | 01 |
| `@lifeos/route` | Route helpers | `withApiErrorHandling`, `withUserRoute`, `withWorkspaceRoute`, `parseJsonBody`, `requireIdempotencyKey` | 01 |
| `@lifeos/app-web` | Next.js app | `/api/v1/**` routes, React components | 01 |
| `@lifeos/app-worker` | Background worker | job queue consumer | 01 (stub) |

## Phase 01 Invariants

- No migrations, no auth, no AI, no UI styling.
- `/api/health` is the only live endpoint.
- `withUserRoute` and `withWorkspaceRoute` throw `AUTH_REQUIRED` — stubs for Phase 02/05.
- All inter-package imports use `@lifeos/*` workspace aliases, never relative `../../` paths.

## Data Flow (typical API request, Phase 02+)

```
Browser → GET /api/v1/workspaces
  → withWorkspaceRoute(handler)
      → validate session (Phase 05)
      → withWorkspaceContext(db, { userId, workspaceId }, async (tx) => {
            const rows = await tx.many('SELECT ...', [...]);
            return Response.json(envelopeOk(rows));
         })
      → on error: envelopeErr(e) + statusForError(e)
```

## Security Boundaries

- RLS enforced at PostgreSQL layer per `app.current_user_id` / `app.current_workspace_id` GUCs.
- No raw `process.env.*` in business code — must use `getServerEnv()`.
- No AI SDK imports outside `packages/ai` (Phase 06+).
- All timestamps in UTC ISO 8601 via `Clock.nowIso()`.
