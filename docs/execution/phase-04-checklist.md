# Phase 04 — Checklist

## A. Preflight
- [x] phase-03-locked tag exists
- [x] phase-03-outputs.md verified
- [x] global-conventions.md present
- [x] rollback.md has Phase 03 section
- [x] CI green on phase/03-domain-schemas before this phase opened
- [x] Branch `phase/04-security` opened from phase-03-locked tag

## B. New Packages (3)
- [x] packages/vault-crypto/src/ — argon2.ts + xchacha20-poly1305.ts + master-key.ts + item-key.ts + envelope.ts + index.ts
- [x] packages/vault-crypto/tests/ — argon2.test.ts + envelope.test.ts + round-trip.test.ts
- [x] packages/security/src/ — csp.ts + nonce.ts + csrf.ts + audit-chain.ts + scanner.ts + oauth-state.ts + index.ts
- [x] packages/security/tests/ — audit-chain.test.ts + csrf.test.ts + oauth-state.test.ts + scanner.test.ts
- [x] packages/offline/src/ — body-hash.ts + outbox.ts + backoff.ts + index.ts
- [x] packages/offline/tests/ — backoff.test.ts + body-hash.test.ts + outbox.test.ts

## C. Migrations 0148 → 0157 (10 migrations)
- [x] 0148 vault_items_encrypted — ciphertext_b64, nonce_b64, wrapped_item_key_b64, item_key_nonce_b64, aad_b64, crypto_version
- [x] 0149 audit_chain_db_hash — prev_hash + event_hash on workspace_audit_events
- [x] 0150 oauth_state_store — table with HMAC-signed state, 10-min TTL
- [x] 0151 csp_reports — CSP violation log table
- [x] 0152 csrf_tokens — DB-backed CSRF token store
- [x] 0153 push_subscriptions — Web Push endpoint + auth + p256dh
- [x] 0154 device_registry — device fingerprint + push sub FK
- [x] 0155 outbox_dead_letter — failed outbox items + retry_count
- [x] 0156 rls_pack_phase04 — RLS for all Phase 04 tables (2996B)
- [x] 0157 lookup_public_share_fn — PostgreSQL function for share lookup

## D. New AppError Codes (11)
- [x] VAULT_DECRYPT_FAILED, VAULT_MASTER_KEY_INVALID, VAULT_ITEM_KEY_INVALID
- [x] CSRF_TOKEN_INVALID, CSRF_TOKEN_MISSING, CSP_VIOLATION_REPORT
- [x] OFFLINE_NETWORK_UNAVAILABLE, OUTBOX_BODY_HASH_MISMATCH
- [x] AUDIT_CHAIN_BROKEN, OAUTH_STATE_INVALID, OAUTH_STATE_EXPIRED
- [x] All codes added to packages/shared/src/errors/codes.ts

## E. ADRs (6)
- [x] ADR 0018 vault-crypto-xchacha20-argon2id (1138B)
- [x] ADR 0019 audit-chain-db-stored-hash (1093B)
- [x] ADR 0020 oauth-pkce-state-store (797B)
- [x] ADR 0021 csp-strict-nonce (955B)
- [x] ADR 0022 sw-offline-outbox-body-hash (909B)
- [x] ADR 0023 migration-range-0148-0199 (928B)

## F. API Routes (21 routes verified)
- [x] auth/login, logout, register (3)
- [x] auth/magic-link/{request,consume} (2)
- [x] auth/password-reset/{request,confirm} (2)
- [x] auth/verify-email (1)
- [x] invitations/[token]/{accept,decline} + route (3)
- [x] me/route (1)
- [x] pages/route + pages/[id]/{archive,move,route} (4)
- [x] workspaces/route + workspaces/[id]/route + invitations + members + members/[userId] (5)

## G. CI Gates (14 scripts)
- [x] check-naming.ts
- [x] check-migrations.ts
- [x] check-rls.ts
- [x] check-routes-envelope.ts (activated — was placeholder in P03)
- [x] check-idempotency.ts
- [x] check-no-sql-in-routes.ts (activated)
- [x] check-no-ai-direct-provider.ts
- [x] check-no-vault-leak.ts (activated — 1318B)
- [x] check-money-columns.ts
- [x] check-timezone-hardcode.ts
- [x] check-encryption-primitives.ts (activated — 397B)
- [x] check-no-duplicate-app-error.ts
- [x] check-no-design-drift.ts
- [x] check-mvp-scope.ts

## H. pgTAP Tests (workspace-level)
- [x] tests/pgtap/0120_tasks_rls.sql (1885B)
- [x] tests/pgtap/0123_notes_rls.sql (1583B)
- [x] tests/pgtap/0126_habits_rls.sql (1544B)
- [x] tests/pgtap/0129_expenses_rls.sql (1618B)
- [x] tests/pgtap/0132_calendar_rls.sql (1246B)
- [x] tests/pgtap/0134_vault_rls.sql (1593B)
- [x] tests/pgtap/0136_ai_usage_rls.sql (1238B)
- [x] tests/pgtap/0156_rls_phase04.sql (4319B)

## I. Unit Tests (workspace-level)
- [x] tests/unit/ai-quota-idempotency.test.ts (887B)
- [x] tests/unit/ai-quota-race.test.ts (683B)
- [x] tests/unit/ai-quota-refund.test.ts (1004B)
- [x] tests/unit/calendar-time-validation.test.ts (1183B)
- [x] tests/unit/expenses-money.test.ts (685B)
- [x] tests/unit/habit-checkin-duplicate.test.ts (1038B)
- [x] tests/unit/note-version-conflict.test.ts (1063B)

## J. Infrastructure
- [x] apps/web/middleware.ts — CSP nonce generation + security headers
- [x] apps/web/public/sw.js — Service Worker (offline outbox)
- [x] apps/web/app/api/_csp-report/route.ts — CSP violation reporting
- [x] apps/web/next.config.mjs — extended with security headers, poweredByHeader: false, reactStrictMode: true
- [x] apps/worker/src/index.ts — boot scaffold (outbox consumer deferred D-058)

## K. Defects Remediated Post-Lock (P04 audit)
- [x] P04-H1: withWorkspaceRoute.ts created in packages/auth-guard/src/ (RESOLVED — merged from phase/02-kernel)
- [x] P04-H2: phase-04-{preflight,decisions-log,checklist}.md created
- [x] P04-H3: E2E stubs moved to tests/e2e/_pending/, real skeletons with describe.skip created
- [x] P04-M3: ADRs 0005-0009 expanded from stubs (merged from phase/02-kernel)
- [x] P04-M5: ADRs 0010-0017 moved to docs/adr/ (canonical location)
- [x] P04-M6: tsbuildinfo added to .gitignore, apps/worker/tsconfig.tsbuildinfo removed from tracking
- [x] P04-M7: apps/web/next.config.mjs expanded with security headers
- [x] P04-L1: *.tsbuildinfo in .gitignore

## Open at Phase 04 Close (carry to P05)
- [ ] P04-H3 E2E: Full HTTP integration (Phase 05 — after server wiring complete)
- [ ] P04-M1: 0118__seed_admin_role_check.sql rename to 0118__rls_smoke_check.sql (low risk — carry)
- [ ] P04-M2: packages/db/tests/ 4 stubs — fill or delete (carry)
- [ ] P04-M4: apps/web/app/api/v1/pages/route.test.ts — real assertions (carry)
- [ ] P04-M6: apps/worker full outbox consumer (D-058 — Phase 05)
- [ ] P04-M8: RESOLVED by phase-03 execution docs creation (merged)

## L. Lock
- [x] git commit -m "phase-04: security — vault-crypto + security + offline + migrations 0148-0157"
- [x] git tag -a phase-04-locked
- [x] git push origin phase/04-security
- [x] git push origin phase-04-locked
