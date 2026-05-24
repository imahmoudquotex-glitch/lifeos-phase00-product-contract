-- File: 0109__workspace_audit_events.sql
-- Phase: 02
-- Description: Append-only audit log for tenant-significant actions.
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS workspace_audit_events (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_user_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL,                          -- e.g. 'member.role_changed'
  subject_type    TEXT,                                   -- e.g. 'membership'
  subject_id      TEXT,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_workspace_time
  ON workspace_audit_events(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_type
  ON workspace_audit_events(event_type);

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_audit_event_type;
--   DROP INDEX IF EXISTS idx_audit_workspace_time;
--   DROP TABLE IF EXISTS workspace_audit_events;
-- COMMIT;
