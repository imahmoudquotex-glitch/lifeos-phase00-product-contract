# Phase 03 — Checklist

## A. Preflight
- [x] phase-02-locked tag exists (sha: 31f9403d)
- [x] phase-02-outputs.md verified
- [x] global-conventions.md present
- [x] rollback.md has Phase 02 section
- [x] CI green on main before phase/03 branch opened
- [x] Branch `phase/03-mvp-baseline` opened

## B. New Packages
- [x] packages/repo — BaseRepo abstract (base-repo.ts + pagination.ts)
- [x] packages/services — domain services barrel
- [x] packages/permissions updated — actor.ts added (UserActor + SystemActor + factory helpers)
- [x] packages/db updated — postgres-adapter.ts (full DbClient implementation) + tx-context.ts

## C. Migrations 0119 → 0147 (29 migrations)
- [x] 0119 profiles_extensions (+ monthly_ai_token_limit on workspaces)
- [x] 0120 tasks
- [x] 0121 tasks_indexes
- [x] 0122 tasks_rls
- [x] 0123 notes
- [x] 0124 notes_versions
- [x] 0125 notes_rls
- [x] 0126 habits
- [x] 0127 habit_checkins
- [x] 0128 habits_rls
- [x] 0129 expenses
- [x] 0130 budgets
- [x] 0131 expenses_rls
- [x] 0132 calendar_events
- [x] 0133 calendar_rls
- [x] 0134 vault_items_metadata
- [x] 0135 vault_rls
- [x] 0136 ai_usage_events
- [x] 0137 ai_usage_indexes
- [x] 0138 ai_usage_rls
- [x] 0139 ai_usage_rpcs (reserve_ai_usage RPC)
- [x] 0140 xp_events
- [x] 0141 daily_reviews
- [x] 0142 import_jobs
- [x] 0143 public_shares
- [x] 0144 webhook_nonces
- [x] 0145 audit_logs_extensions
- [x] 0146 rate_limit_buckets_extensions
- [x] 0147 outbound_emails
- [x] every migration has -- ROLLBACK: footer

## D. Domain Service Modules (packages/services/src/)
- [x] ai/ (repo + service + types + index)
- [x] calendar/ (repo + service + types + index)
- [x] expenses/ (repo + service + types + index) — createWithBudgetCheck via SELECT FOR UPDATE
- [x] habits/ (repo + service + types + index) — 23505 → HABIT_CHECKIN_DUPLICATE
- [x] imports/ (repo + service + index)
- [x] notes/ (repo + service + types + index) — updateWithVersion returns Note|'CONFLICT'|null
- [x] reviews/ (repo + service + types + index)
- [x] shares/ (repo + service + index)
- [x] tasks/ (repo + service + types + index)
- [x] vault/ (repo + service + types + index) — ciphertext stub; encryption in Phase 04
- [x] webhooks/ (repo + service + index)
- [x] xp/ (repo + service + types + index)
- [ ] goals/ — DEFERRED to Phase 04 (see D-047 in decisions-log)

## E. RLS Coverage (one migration per domain)
- [x] 0122 tasks_rls — app_is_member policy
- [x] 0125 notes_rls — app_is_member policy
- [x] 0128 habits_rls — app_is_member policy
- [x] 0131 expenses_rls — app_is_member policy
- [x] 0133 calendar_rls — app_is_member policy
- [x] 0135 vault_rls — BOTH app.current_workspace_id AND app.current_user_id
- [x] 0138 ai_usage_rls — app_is_member policy

## F. ADRs
- [x] ADR 0010 money-storage-bigint-cents
- [x] ADR 0011 ai-quota-race-free-rpc
- [x] ADR 0012 note-version-optimistic-concurrency
- [x] ADR 0013 vault-metadata-vs-crypto-separation
- [x] ADR 0014 base-repo-no-select-star
- [x] ADR 0015 actor-type-in-permissions
- [x] ADR 0016 workspace-monthly-ai-token-limit
- [x] ADR 0017 expense-budget-check-transactional
- [x] ADRs 0010-0017 location: docs/adr/ (canonical) — P03-H1 noted and resolved

## G. Architecture Docs
- [x] docs/architecture/api-envelope.md
- [x] docs/architecture/error-model.md
- [x] docs/architecture/id-generation.md
- [x] docs/architecture/money-and-time.md
- [x] docs/architecture/overview.md
- [x] docs/architecture/package-map.md

## H. Execution Docs
- [x] phase-03-preflight.md
- [x] phase-03-decisions-log.md (13 decisions, D-035–D-047)
- [x] phase-03-outputs.md (see separate file)
- [x] phase-03-checklist.md (this file)

## I. Post-Phase Defect Fixes Applied (P02 defects resolved in P03 pass)
- [x] P02-H1: withWorkspaceRoute.ts created in packages/auth-guard/src/
- [x] P02-H2: csrf.ts expanded to real double-submit cookie validation
- [x] P02-M1+L1: tree.ts updated to use DbClient (not `client: any`)
- [x] P02-M1: requireWorkspace.ts now throws WORKSPACE_NOT_FOUND (404) not AUTH_FORBIDDEN (403)
- [x] ADRs 0005-0009 expanded from stubs to full templates
- [x] P03-M5: actor.ts expanded with full Actor union, type guards, and factory functions

## J. Lock
- [x] git commit -m "phase-03: mvp-baseline — domain services + repo + permissions"
- [x] git tag -a phase-03-locked
- [x] git push origin phase/03-mvp-baseline
- [x] git push origin phase-03-locked
