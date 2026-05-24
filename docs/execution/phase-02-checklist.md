# Phase 02 — Checklist

## A. Preflight
- [x] phase-01-locked tag exists
- [x] phase-01-outputs.md verified
- [x] global-conventions.md present
- [x] rollback.md has Phase 01 section
- [x] CI green on main
- [x] Branch `phase/02-kernel` opened

## B. Migrations 0100 → 0118
- [x] 0100 users
- [x] 0101 sessions
- [x] 0102 magic_link_tokens
- [x] 0103 password_reset_tokens
- [x] 0104 email_verification_tokens
- [x] 0105 oauth_accounts
- [x] 0106 workspaces
- [x] 0107 workspace_memberships (uq_workspace_owner_marker)
- [x] 0108 workspace_invitations
- [x] 0109 workspace_audit_events
- [x] 0110 profiles
- [x] 0111 pages
- [x] 0112 pages tree triggers
- [x] 0113 RLS helpers (app_current_user_id, app_current_workspace_id, app_is_member)
- [x] 0114 RLS enable + FORCE on all tenant tables
- [x] 0115 RLS policies workspaces
- [x] 0116 RLS policies memberships + invitations + audit
- [x] 0117 RLS policies pages
- [x] 0118 smoke assertion
- [x] every migration has -- ROLLBACK: footer

## C. Packages
- [x] @lifeos/auth (password, session, tokens, verification, oauth, workspace-context)
- [x] @lifeos/auth-guard (requireUser, requireWorkspace, requireCapability, csrf)
- [x] @lifeos/workspaces (workspace, membership, invitation, slug, personal)
- [x] @lifeos/permissions (capabilities, resolver)
- [x] @lifeos/pages (page.service, tree, slug)

## D. API Routes
- [x] /api/v1/auth/* (register, login, logout, magic-link, password-reset, verify-email)
- [x] /api/v1/me
- [x] /api/v1/workspaces (+ [id], members, invitations)
- [x] /api/v1/invitations/[token]/(accept|decline)
- [x] /api/v1/pages (+ [id], move, archive)

## E. Cross-cutting
- [x] withWorkspaceContext used on every tenant query
- [x] No raw SQL outside packages/db or services
- [x] No SELECT * anywhere
- [x] AppError used for every failure path
- [x] CSRF guard on every mutating /api/v1/* route
- [x] Idempotency-Key required on every POST mutating route

## F. Tests
- [x] capabilities.test.ts
- [x] resolver.test.ts
- [x] tree-cycle.test.ts
- [x] recompute-depth.test.ts
- [x] last-owner.test.ts
- [x] transfer-ownership-atomicity.test.ts
- [x] invitation-generic-error.test.ts
- [x] session-lifecycle.test.ts
- [x] password-hash.test.ts
- [x] workspace-context.test.ts
- [x] pgTAP RLS isolation
- [x] E2E auth flow
- [x] E2E workspace isolation
- [x] E2E page tree

## G. Docs & ADRs
- [x] ADR 0005 session storage
- [x] ADR 0006 RLS context strategy
- [x] ADR 0007 page tree depth strategy
- [x] ADR 0008 invitation generic error
- [x] ADR 0009 transfer ownership atomicity
- [x] phase-02-checklist.md filled
- [x] phase-02-decisions-log.md filled (≥ 8 decisions)
- [x] phase-02-outputs.md filled
- [x] rollback.md → Phase 02 section appended

## H. Lock
- [x] git commit -m "phase-02: kernel — auth + workspaces + pages + RLS"
- [x] git tag -a phase-02-locked
- [x] git push origin phase/02-kernel
- [x] git push origin phase-02-locked
