-- File: 0146__rate_limit_buckets_extensions.sql
-- Phase: 03
-- Description: Rate limit buckets table with ALL columns used by Phase 05 with-rate-limit.ts.
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  id             TEXT PRIMARY KEY,
  bucket_key     TEXT NOT NULL UNIQUE,
  -- Phase 03 leaky-bucket fields
  tokens         NUMERIC NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Phase 05 sliding-window fields (required by with-rate-limit.ts)
  attempts       INTEGER NOT NULL DEFAULT 0,
  window_start_ms BIGINT NOT NULL DEFAULT 0,
  locked_until_ms BIGINT,
  -- Scoping fields
  scope          TEXT NOT NULL DEFAULT 'global',
  workspace_id   TEXT REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rl_ws_scope
  ON rate_limit_buckets(workspace_id, scope)
  WHERE workspace_id IS NOT NULL;

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_rl_ws_scope;
-- DROP TABLE IF EXISTS rate_limit_buckets;
-- COMMIT;
