# Phase 00 Outputs — Inter-Phase Contract

> Phase 01 MUST read this file and MUST verify each item before starting.

## 1. Guaranteed Files Produced

### Product docs (docs/product/)
- vision.md
- icp.md
- pains-and-jobs.md
- differentiators.md
- mvp-scope.md (15 rows locked)
- out-of-scope.md
- success-metrics.md
- free-forever-model.md
- risk-register.md (RISK-001…RISK-011)
- launch-criteria.md
- roadmap.md (60-phase map)

### Governance docs (docs/governance/)
- global-conventions.md ← Phase 01+ reads this as SoT before every decision.
- global-forbidden-list.md
- scope-gate.md
- privacy-claims-policy.md
- ai-execution-rules.md

### Execution docs (docs/execution/)
- phase-00-understanding.md
- phase-00-checklist.md
- phase-00-decisions-log.md (D-001…D-012)
- phase-00-outputs.md (this file)

### ADR
- docs/adr/template.md

### Scripts
- scripts/check-mvp-scope.ts (exports `MVP_ALLOWED`, `assertMvpFeature`, `isMvpFeature`, `PostMvpFeatureError`)
- scripts/__tests__/check-mvp-scope.test.ts (alignment test passes)
- vitest.config.ts

## 2. Guaranteed Git Tag
- `phase-00-product-contract-locked` (annotated tag, pushed to origin)

## 3. Env Vars Introduced
- None in Phase 00.

## 4. Migration Range Used
- None (Phase 00 is docs + scripts only; no DB).

## 5. Stubs Left for Next Phase
- scripts/check-mvp-scope.ts runs as a standalone script; Phase 01 will wire it into the CI turbo pipeline as part of `turbo.json`.
- Global conventions (§19 Branches & Tags) reference `phase/01-architecture` but that branch does not exist yet.

## 6. Open Risks Carried Forward
- RISK-001 → RISK-011 (all Open; mitigation starts in Phase 01–04).
- D-012: migration ranges will need per-migration-runner enforcement in Phase 01 (`scripts/migrate.ts`).
