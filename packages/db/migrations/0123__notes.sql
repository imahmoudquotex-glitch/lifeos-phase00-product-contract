-- File: 0123__notes.sql
-- Phase: 03
-- Description: Notes domain table.
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS notes (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	created_by TEXT NOT NULL REFERENCES users(id),
	title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
	body_md TEXT NOT NULL DEFAULT '',
	version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
	is_deleted BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notes_ws_updated ON notes(workspace_id, updated_at DESC) WHERE is_deleted = false;
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS notes CASCADE;
-- COMMIT;
