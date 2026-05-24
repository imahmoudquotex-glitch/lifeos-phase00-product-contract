-- File: 0146__rate_limit_buckets_extensions.sql
-- Phase: 03
-- Description: Rate limit buckets table (CREATE IF NOT EXISTS guard) + Phase 03 extension columns.
-- NOTE: rate_limit_buckets.tokens is NOT money (leaky-bucket counter), NUMERIC is allowed here only.
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
	id TEXT PRIMARY KEY,
	bucket_key TEXT NOT NULL UNIQUE,
	tokens NUMERIC NOT NULL DEFAULT 0,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE rate_limit_buckets
	ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'global',
	ADD COLUMN IF NOT EXISTS workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_rl_ws_scope ON rate_limit_buckets(workspace_id, scope) WHERE workspace_id IS NOT NULL;
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_rl_ws_scope;
-- ALTER TABLE rate_limit_buckets DROP COLUMN IF EXISTS workspace_id, DROP COLUMN IF EXISTS scope;
-- COMMIT;
