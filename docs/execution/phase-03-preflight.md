# Phase 03 Preflight

## Gate: phase-02-locked tag

- phase-02-locked tag: ✅ present (sha: 31f9403d5a0417d71c7c0690bc25a60e88390244)
- phase-02-outputs.md: ✅ present and verified
- global-conventions.md: ✅ §1–§22 readable
- rollback.md: ✅ Phase 02 section present

## Required environment additions (Phase 03 specific)

- `VAULT_MASTER_KEY` — NOT required yet (Phase 04 — crypto wiring). Migration creates metadata table only.
- `AI_PROVIDER_API_KEY` — NOT required yet (Phase 04). ai_usage_events and RLS exist; actual LLM calls deferred.
- All Phase 02 env vars still required: DATABASE_URL, SESSION_PEPPER, SESSION_TTL_DAYS, SESSION_COOKIE_NAME, APP_URL, etc.

## DB state required before Phase 03 migrations

- Migrations 0100–0118 applied and verified (Phase 02 smoke check passed).
- `schema_migrations` table tracks applied migrations via scripts/migrate.ts.
- `app_is_member`, `app_current_user_id`, `app_current_workspace_id` GUC helpers present (0113).

## CI checks

- Phase 02 CI was green on phase/02-docs-platform-auth-rls branch before this phase opened.
- Branch: phase/03-mvp-baseline opened from phase-02-locked tag.

## Open blockers at phase start

- `packages/services` directory and `packages/repo` did not exist — created as part of Phase 03 setup.
- `actor.ts` was referenced by ADR 0015 but not present in permissions package — to be created in Phase 03.
- goals module: MVP_ALLOWED list includes goals — decision deferred (see decisions-log D-047).

## Migration range allocated

- Phase 02 used: 0100–0118
- Phase 03 allocated: 0119–0199 (used: 0119–0147, 29 migrations)
- Phase 04 available from: 0148
