# Phase 02 Checklist: Kernel (Auth + Workspaces + Pages + RLS)

## Preflight
- [x] Verified Phase 01 locked
- [x] Read `global-conventions.md`
- [x] Reviewed `rollback.md`

## 1. Auth Database Schema
- [x] `0100__identity_users.sql` (email, verified, password, status)
- [x] `0101__identity_sessions.sql` (hash token, TTL)
- [x] `0102__identity_magic_links.sql` (single use)
- [x] `0103__identity_password_resets.sql`
- [x] `0104__identity_email_verifications.sql`
- [x] `0105__identity_oauth_accounts.sql`

## 2. Workspaces & Profiles
- [x] `0106__workspaces.sql` (slug format check, owner)
- [x] `0107__workspace_memberships.sql` (role enum, unique owner per workspace check)
- [x] `0108__workspace_invitations.sql`
- [x] `0109__workspace_audit_events.sql`
- [x] `0110__profiles.sql`

## 3. Pages Tree Schema
- [x] `0111__pages.sql` (depth <= 50 check)
- [x] `0112__pages_tree_triggers.sql` (auto-compute depth, prevent moves across workspaces)

## 4. Row-Level Security (RLS)
- [x] `0113__rls_helpers.sql` (`app_current_workspace_id`, `app_is_member`)
- [x] `0114__rls_enable_force.sql` (ENABLE and FORCE on all tenant tables)
- [x] `0115__rls_policies_workspaces.sql` (member read, owner write)
- [x] `0116__rls_policies_memberships.sql` (isolation)
- [x] `0117__rls_policies_pages.sql` (isolation)
- [x] `0118__seed_admin_role_check.sql`

## 5. Kernel Packages (TypeScript)
- [x] `@lifeos/auth` (`password.ts`, `session.ts`, `workspace-context.ts`)
- [x] `@lifeos/auth-guard` (`requireUser`, `requireWorkspace`)
- [x] `@lifeos/permissions` (`capabilities.ts`, `resolver.ts`)
- [x] `@lifeos/pages` (`tree.ts` cycle detection & depth recomputation)
- [x] `@lifeos/workspaces` (`invitation.service.ts`)
- [x] Extend `serverEnv` in `@lifeos/shared` (SESSION_PEPPER, COOKIE_DOMAIN)
- [x] Finalize `withWorkspaceRoute` with DB connection injection

## 6. API Routes
- [x] `POST /api/v1/auth/register`
- [x] `POST /api/v1/auth/login`
- [x] `POST /api/v1/auth/logout`
- [x] `GET /api/v1/me`
- [x] `GET|POST /api/v1/workspaces`
- [x] `GET|POST /api/v1/pages` (Uses `withWorkspaceRoute`)

## 7. Migration Runner
- [x] `scripts/migrate.ts` created

## 8. Tests
- [x] `packages/pages/src/tree.test.ts`
- [x] `packages/auth/src/session.test.ts`
- [x] `packages/permissions/src/resolver.test.ts`
- [x] `apps/web/app/api/v1/pages/route.test.ts`
- [x] `db/tests/rls_isolation.test.sql`

## 9. Docs & Lock
- [x] `phase-02-decisions-log.md`
- [x] `phase-02-outputs.md`
- [x] Update `docs/runbooks/rollback.md`
- [x] Git Commit & Tag `phase-02-locked`
