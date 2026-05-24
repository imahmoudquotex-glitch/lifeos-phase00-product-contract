# Phase 00 Checklist

> AI Executor: tick every box in order. Do NOT proceed to Phase 01 until all are ticked and the lock marker (Step 25) is written.

## A. Docs written (no empty headings)
- [x] docs/execution/phase-00-understanding.md
- [x] docs/product/vision.md
- [x] docs/product/icp.md
- [x] docs/product/pains-and-jobs.md
- [x] docs/product/differentiators.md
- [x] docs/product/mvp-scope.md (15 rows + notation note)
- [x] docs/product/out-of-scope.md
- [x] docs/product/success-metrics.md
- [x] docs/product/free-forever-model.md
- [x] docs/product/risk-register.md (RISK-001 … RISK-011)
- [x] docs/product/launch-criteria.md
- [x] docs/product/roadmap.md (60-phase map)
- [x] docs/adr/template.md
- [x] docs/governance/scope-gate.md
- [x] docs/governance/privacy-claims-policy.md
- [x] docs/governance/ai-execution-rules.md
- [x] docs/governance/global-conventions.md
- [x] docs/governance/global-forbidden-list.md

## B. Scripts written and passing
- [x] scripts/check-mvp-scope.ts
- [x] scripts/__tests__/check-mvp-scope.test.ts
- [x] `pnpm tsx scripts/check-mvp-scope.ts auth` exits 0
- [x] `pnpm tsx scripts/check-mvp-scope.ts workspace` exits 0
- [x] `pnpm tsx scripts/check-mvp-scope.ts billing` exits 1 with `POST_MVP_FEATURE`
- [x] `vitest run scripts/__tests__/check-mvp-scope.test.ts` passes (alignment 1:1) — 6/6 tests ✓

## C. Consistency checks
- [x] mvp-scope.md row count = MVP_ALLOWED.size (= 15) — both `auth` and `workspace` exist as separate rows.
- [x] No file uses the alias `auth+workspace` or `auth + workspace`.
- [x] Every Out-of-Scope row has a reason and a future phase or "never".
- [x] Every Risk has Owner + Mitigation + Status.
- [x] No file contains the word "Stripe", "paywall", or "premium-only".
- [x] No file claims "Zero-Knowledge" without `CLAIM_NOT_ALLOWED_YET` (lifted after Phase 04 tests pass).

## D. Lock
- [x] Step 25 marker line appended below.
- [x] git tag `phase-00-product-contract-locked` created and pushed.

## Lock marker (appended by Step 25)
<!-- phase-00-product-contract-locked: 2026-05-24T09:59:00+03:00 -->
