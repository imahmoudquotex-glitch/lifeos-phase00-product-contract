-- File: 0140__xp_events.sql
-- Phase: 03
-- Description: XP events ledger (append-only).
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS xp_events (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	user_id TEXT NOT NULL REFERENCES users(id),
	source TEXT NOT NULL,
	delta INTEGER NOT NULL,
	metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xp_ws_user ON xp_events(workspace_id, user_id, created_at DESC);
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS xp_isolation ON xp_events;
CREATE POLICY xp_isolation ON xp_events
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS xp_events CASCADE;
-- COMMIT;
