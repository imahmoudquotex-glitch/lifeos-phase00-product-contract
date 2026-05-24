# Phase 02 Outputs — Contract for Phase 03

## A. Files & Packages Delivered
- packages/auth, packages/auth-guard, packages/workspaces, packages/permissions, packages/pages
- packages/db/migrations/0100..0118 (idempotent + reversible)
- apps/web/src/app/api/v1/auth/**, /me, /workspaces/**, /invitations/**, /pages/**
- tests/pgtap/{0114, 0117}_*.sql
- docs/adr/0005..0009
- docs/execution/phase-02-{checklist,decisions-log,outputs}.md
- docs/runbooks/rollback.md (Phase 02 section appended)

## B. Git Artefacts
- Branch: phase/02-kernel
- Commit message: "phase-02: kernel — auth + workspaces + pages + RLS"
- Annotated tag: phase-02-locked

## C. Conventions Established (binding for Phase 03+)
- `withWorkspaceContext(db, { userId, workspaceId }, fn)` is the ONLY entry point for tenant data.
- Every tenant table MUST have ENABLE + FORCE RLS + an explicit policy using `app_is_member` or `app_current_workspace_id`.
- Every migration MUST include `-- ROLLBACK:` footer.
- Every mutating POST route MUST require `Idempotency-Key`.
- Every permission decision MUST go through `@lifeos/permissions/resolver.assertCapability`.
- Every invitation failure MUST be raised via a fresh `invitationGenericError()` call (factory function, not a shared singleton).
- AppError taxonomy now includes: AUTH_REQUIRED, AUTH_FORBIDDEN, AUTH_INVALID_CREDENTIALS, AUTH_EMAIL_TAKEN, AUTH_RATE_LIMITED, SESSION_EXPIRED, SESSION_INVALID, WORKSPACE_NOT_FOUND, WORKSPACE_LAST_OWNER, MEMBERSHIP_REQUIRED, INVITATION_INVALID, PAGE_NOT_FOUND, PAGE_INVALID_MOVE, PAGE_DEPTH_EXCEEDED.

## D. Environment Variables (REQUIRED for Phase 03)
All of these are added to `getServerEnv()` schema in `@lifeos/shared/server-env` (Phase 02 extends Phase 01 schema; see D-029):
- DATABASE_URL                          (from Phase 01)
- NODE_ENV                              (from Phase 01)
- APP_URL                               (NEW in Phase 02)
- SESSION_PEPPER                        (NEW in Phase 02, ≥ 32 chars, secret)
- SESSION_TTL_DAYS                      (NEW in Phase 02, default 30)
- SESSION_COOKIE_NAME                   (NEW in Phase 02, default lifeos_sid)
- MAGIC_LINK_TTL_MINUTES                (NEW in Phase 02, default 15)
- PASSWORD_RESET_TTL_MINUTES            (NEW in Phase 02, default 60)
- EMAIL_VERIFICATION_TTL_HOURS          (NEW in Phase 02, default 24)

## E. Migration Range
- Location: `packages/db/migrations/*.sql` (lives inside Phase 01's `packages/db/` package; this is the binding path for all future phases).
- Runner: `scripts/migrate.ts` tracks applied migrations in `schema_migrations` table.
- Used: 0100..0118
- Available for Phase 03: 0119..0199 (tasks, notes, habits, expenses, calendar, vault stubs, ai_usage)
- Phase 03 must continue ENABLE + FORCE RLS pattern for every new tenant table.

## F. Stubs Left for Later Phases
- oauth_accounts table only — full OAuth flow in Phase 04.
- email send is stub-console in dev; real provider in Phase 04 (or per owner input).
- CSRF double-submit cookie helper exists; UI wiring lives in Phase 05.
- vault encryption schema not yet — Phase 04 (`@noble/ciphers`).

## G. Open Risks / Known Limitations
- `recomputeDepthForSubtree` is O(N) per move; acceptable for trees ≤ 5k nodes. Optimize if profiles show > 200ms.
- `last_seen_at` write on every validateSession is an UPDATE-per-request — consider batching in Phase 06 (perf phase).
- `oauth_accounts.email_at_link` not unique on purpose; identity merge policy decided in Phase 04.

## H. Definition of Done Cross-check
- [x] All 19 migrations applied + reversible
- [x] All 5 packages green typecheck + lint + unit tests
- [x] All API routes envelope-compliant
- [x] pgTAP RLS isolation passing
- [x] E2E auth + isolation + page tree passing
- [x] CI green on phase/02-kernel
- [x] phase-02-locked tag pushed
- [x] phase-02-outputs.md committed
- [x] rollback.md Phase 02 section appended
