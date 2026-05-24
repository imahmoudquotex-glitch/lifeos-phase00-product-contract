# Risk Register

## RISK-001 — RLS bypass
- Category: Security
- Severity: P0
- Likelihood: Medium
- Impact: Cross-tenant data leak.
- Mitigation: RLS + FORCE RLS + pgTAP + tenant fuzzer (Phase 02).
- Owner: Security/Backend
- Status: Open

## RISK-002 — AI sees vault content
- Category: Privacy
- Severity: P0
- Likelihood: Medium
- Impact: Private data leak via AI provider.
- Mitigation: Sensitivity levels + vault guard + CI scan (Phase 04 + Phase 06).
- Owner: AI/Security
- Status: Open

## RISK-003 — Feature creep
- Category: Product
- Severity: P1
- Likelihood: High
- Impact: MVP never ships.
- Mitigation: Scope gate + `MVP_ALLOWED` + CI alignment test (this phase).
- Owner: Product
- Status: Open

## RISK-004 — Infrastructure cost outgrows donations
- Category: Sustainability
- Severity: P1
- Likelihood: Medium
- Impact: Free-forever promise breaks; service degrades or shuts down.
- Mitigation: Cost dashboard, per-workspace soft quotas, opt-in usage caps for AI tokens; reviewed quarterly; documented in `free-forever-model.md`.
- Owner: Product/Infra
- Status: Open

## RISK-005 — Vendor / provider lock-in
- Category: Engineering
- Severity: P1
- Likelihood: Medium
- Impact: Forced migration with downtime or data loss.
- Mitigation: Single DbClient interface (`@lifeos/db`) over `postgres`; AI behind `@lifeos/ai` gateway; storage behind `@lifeos/storage`; email behind `@lifeos/email`. Every provider needs ≥1 stub adapter to prove the abstraction.
- Owner: Backend
- Status: Open

## RISK-006 — Performance degradation as data grows
- Category: Performance
- Severity: P1
- Likelihood: High
- Impact: p95 latency breaches success-metric thresholds.
- Mitigation: Mandatory indexes per repo, `EXPLAIN ANALYZE` regression test in Phase 03, per-table row-count alerts, archival policy for `audit_events` / `ai_usage_events` / `idempotency_keys` (Phase 04+).
- Owner: Backend
- Status: Open

## RISK-007 — Auth token leakage in PWA offline mode
- Category: Security
- Severity: P0
- Likelihood: Low
- Impact: Account takeover on shared device.
- Mitigation: Cookies httpOnly + Secure + SameSite=Strict; tokens never in IndexedDB / localStorage / SW cache; SW deny-list includes `/api/auth/*`; offline guard refuses authenticated cache; tests in Phase 04.
- Owner: Security/Frontend
- Status: Open

## RISK-008 — Service Worker caches authenticated content
- Category: Privacy
- Severity: P0
- Likelihood: Low
- Impact: Cross-user leak on shared device.
- Mitigation: SW deny-list + Set-Cookie short-circuit + tests (Phase 04).
- Owner: Frontend
- Status: Open

## RISK-009 — Open redirect / OAuth state replay
- Category: Security
- Severity: P0
- Likelihood: Low
- Impact: Account takeover via crafted OAuth callback.
- Mitigation: `safeRedirectPath` + signed OAuth state with nonce + replay store (Phase 04/05).
- Owner: Security
- Status: Open

## RISK-010 — Crypto algorithm drift / weak vault
- Category: Security
- Severity: P0
- Likelihood: Low
- Impact: Vault data becomes unrecoverable or weakly protected.
- Mitigation: Pinned `@noble/ciphers`, version locked, single envelope format (Phase 04).
- Owner: Security
- Status: Open

## RISK-011 — Duplicate source of truth (errors, MVP list, conventions)
- Category: Engineering
- Severity: P1
- Likelihood: High
- Impact: Drift between modules, untraceable bugs.
- Mitigation: CI guards `check-no-duplicate-app-error.ts` + alignment test for `MVP_ALLOWED`; one global-conventions file as SoT.
- Owner: DX
- Status: Open
