# Rollback Runbook — LifeOS

> Updated whenever a new external system (storage, push, AI provider, migration range, billing-adjacent system) is added. Each phase whose Definition of Done introduces irreversible state MUST update this file.

## 1. Principles
- Every deployable artefact corresponds to exactly one annotated git tag of the form `phase-NN-locked`.
- Rolling back = redeploying the previous `phase-NN-locked` tag.
- The database is the only stateful surface that does not trivially revert. Migrations are forward-only at the SQL level; rollback is documented per migration.
- No phase is considered complete until its rollback path is written here.

## 2. Code rollback (any phase ≥ 01)

```bash
# 1) Identify the previous good tag
git tag --list 'phase-*-locked' --sort=-creatordate | head -5

# 2) Check out and redeploy
git checkout phase-NN-locked

# Follow the deploy platform's redeploy procedure for this tag.
```

## 3. Migration rollback (from Phase 02 onward)
- Every migration file MUST end with a `-- ROLLBACK:` comment block describing the inverse SQL.
- For destructive migrations (DROP COLUMN, DROP TABLE), the rollback block MUST include the data-preservation step (CREATE TABLE … SELECT * FROM … before DROP).
- For non-destructive forward additions (ADD COLUMN nullable, CREATE INDEX CONCURRENTLY), the rollback is the literal `DROP` of the new object.
- Rollback execution requires a maintenance window unless explicitly marked `-- ROLLBACK-SAFE-ONLINE:` in the migration footer.

## 4. Feature-flag fallback (from Phase 05 onward, when flags exist)
- New user-visible features ship behind a flag in `@lifeos/shared/flags`.
- Disabling the flag does NOT require a redeploy; it requires a single config change.
- A feature flag rollback is preferred over a tag rollback whenever the breaking change is in UI or non-schema logic.

## 5. Secrets rollback
- If a secret is leaked: rotate in the deploy platform first, then in CI secrets, then update `.env.example` row if the variable name changes.
- See `docs/runbooks/secret-rotation.md` (introduced before Phase 60).

## 6. Storage rollback (from Phase 03 onward, when storage exists)
- Object storage operations MUST be idempotent and use content-addressed keys; no rollback needed for puts.
- For deletes, soft-delete only; permanent delete requires an explicit grace period documented here.

## 7. Push / email / external provider rollback (from Phase 04 onward)
- Disable the provider in `@lifeos/shared/env` or via feature flag.
- Outbox-backed integrations (Phase 04+) drain after rollback automatically.

## 8. Per-phase rollback notes
Each phase appends its own subsection here as part of its Definition of Done.

### Phase 01 — Architecture & Naming
- Rollback = redeploy the previous tag (none yet; this is the first phase that produces deployable code).
- No DB migrations, no external providers.
- Removing `phase-01-locked` tag is **forbidden**; superseding tag MUST be `phase-01-locked-revoked` with an ADR.
