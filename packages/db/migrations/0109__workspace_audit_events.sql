-- File: 0109__workspace_audit_events.sql
-- Phase: 02
-- Description: Append-only audit log for tenant-significant actions.
-- COLUMNS: actor_user_id, created_at, event_hash, prev_hash
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS workspace_audit_events (
  id              TEXT PRIMARY KEY,                         -- ULID
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_user_id   TEXT REFERENCES users(id) ON DELETE SET NULL,  -- actor_id alias NOT used
  event_type      TEXT NOT NULL,                            -- e.g. 'auth.signin.success'
  subject_type    TEXT,
  subject_id      TEXT,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  prev_hash       TEXT NOT NULL DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',
  event_hash      TEXT,                                     -- SHA-256 chain hash
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()        -- NOT occurred_at
);

CREATE INDEX IF NOT EXISTS idx_audit_workspace_time
  ON workspace_audit_events(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_type
  ON workspace_audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_hash
  ON workspace_audit_events(event_hash) WHERE event_hash IS NOT NULL;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_audit_hash;
--   DROP INDEX IF EXISTS idx_audit_event_type;
--   DROP INDEX IF EXISTS idx_audit_workspace_time;
--   DROP TABLE IF EXISTS workspace_audit_events;
-- COMMIT;
