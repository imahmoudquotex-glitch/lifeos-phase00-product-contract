# Phase 04 Rollback Runbook

## Overview

Phase 04 introduced 3 new workspace packages, 10 migrations (0148..0157), and middleware changes. This runbook covers rollback in reverse order.

## Order (reverse of apply)

1. `pnpm tsx scripts/rollback-migration.ts 0157` ... down to `pnpm tsx scripts/rollback-migration.ts 0148`
2. `git revert <merge-commit>` for the 3 packages (`vault-crypto`, `security`, `offline`)
3. `git tag -d phase-04-locked` + `git push origin :refs/tags/phase-04-locked`
4. Re-deploy from `phase-03-locked` tag

## Per-Migration Rollback SQL

Each migration file contains a `-- ROLLBACK:` footer with the exact SQL. Run them in reverse order:

```sql
-- 0157
DROP FUNCTION IF EXISTS lookup_public_share(TEXT);
DELETE FROM schema_migrations WHERE version='0157';

-- 0156
DROP POLICY IF EXISTS csp_reports_select ON csp_reports;
DROP POLICY IF EXISTS csp_reports_insert ON csp_reports;
ALTER TABLE csp_reports DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS csrf_tokens_all ON csrf_tokens;
ALTER TABLE csrf_tokens DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS push_subs_all ON push_subscriptions;
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS device_registry_all ON device_registry;
ALTER TABLE device_registry DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS outbox_dl_all ON outbox_dead_letter;
ALTER TABLE outbox_dead_letter DISABLE ROW LEVEL SECURITY;
DELETE FROM schema_migrations WHERE version='0156';

-- 0155
DROP TABLE IF EXISTS outbox_dead_letter;
DELETE FROM schema_migrations WHERE version='0155';

-- 0154
DROP TABLE IF EXISTS device_registry;
DELETE FROM schema_migrations WHERE version='0154';

-- 0153
DROP TABLE IF EXISTS push_subscriptions;
DELETE FROM schema_migrations WHERE version='0153';

-- 0152
DROP TABLE IF EXISTS csrf_tokens;
DELETE FROM schema_migrations WHERE version='0152';

-- 0151
DROP TABLE IF EXISTS csp_reports;
DELETE FROM schema_migrations WHERE version='0151';

-- 0150
DROP TABLE IF EXISTS oauth_state_store;
DELETE FROM schema_migrations WHERE version='0150';

-- 0149
DROP INDEX IF EXISTS idx_audit_event_hash;
ALTER TABLE workspace_audit_events DROP COLUMN IF EXISTS prev_hash, DROP COLUMN IF EXISTS event_hash;
DELETE FROM schema_migrations WHERE version='0149';

-- 0148
ALTER TABLE vault_items DROP COLUMN IF EXISTS ciphertext_b64, DROP COLUMN IF EXISTS nonce_b64, DROP COLUMN IF EXISTS wrapped_item_key_b64, DROP COLUMN IF EXISTS item_key_nonce_b64, DROP COLUMN IF EXISTS aad_b64, DROP COLUMN IF EXISTS crypto_version;
ALTER TABLE workspaces DROP COLUMN IF EXISTS vault_master_salt_b64, DROP COLUMN IF EXISTS vault_kdf_params;
DELETE FROM schema_migrations WHERE version='0148';
```

## Data Preservation

- `vault_items` rows with `ciphertext_b64 = NULL` remain — the column additions are additive.
- `workspace_audit_events`: `prev_hash`/`event_hash` are dropped; the chain can be rebuilt on re-apply.
- `oauth_state_store`, `csp_reports`, `csrf_tokens`, `push_subscriptions`, `device_registry`, `outbox_dead_letter` tables are fully dropped (no data in dev at this point).

## Safety Checks Before Rollback

```bash
# Confirm tag exists
git tag -l phase-04-locked

# Confirm no Phase 05 migrations depend on Phase 04 tables
grep -r "push_subscriptions\|device_registry\|outbox_dead_letter" packages/db/migrations/ | grep "05"
```
