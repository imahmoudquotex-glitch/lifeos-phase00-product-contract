# Phase 03 Preflight

## Required Tags
- phase-02-locked: yes ✅

## Required Phase 02 Outputs
- withWorkspaceContext working: yes ✅
- withWorkspaceRoute real implementation: yes ✅
- assertCapability (from @lifeos/permissions) available: yes ✅
- AppError 2-arg signature: yes ✅
- scripts/migrate.ts working: yes ✅
- ServerEnv extended (SESSION_*, APP_URL): yes ✅

## Required Inputs
- DATABASE_URL: provided (in .env.local)
- AI provider key: mock (live optional in Phase 03)

## Checks
- typecheck: pass ✅
- lint: pass ✅ (warnings only — no errors)
- existing pgTAP tests: N/A (Phase 02 had no pgTAP)
- existing unit tests: pass ✅
