-- File: 0124__note_versions.sql
-- Phase: 03
-- Description: Note versions for optimistic concurrency (append-only).
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS note_versions (
	id TEXT PRIMARY KEY,
	note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	version INTEGER NOT NULL CHECK (version >= 1),
	title TEXT NOT NULL,
	body_md TEXT NOT NULL,
	edited_by TEXT NOT NULL REFERENCES users(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT uq_note_version UNIQUE (note_id, version)
);
CREATE INDEX IF NOT EXISTS idx_note_versions_note ON note_versions(note_id, version DESC);
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS note_versions CASCADE;
-- COMMIT;
