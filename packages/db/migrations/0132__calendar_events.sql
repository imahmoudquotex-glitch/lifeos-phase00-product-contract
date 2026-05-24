-- File: 0132__calendar_events.sql
-- Phase: 03
-- Description: Calendar events domain table.
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS calendar_events (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	created_by TEXT NOT NULL REFERENCES users(id),
	title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
	starts_at TIMESTAMPTZ NOT NULL,
	ends_at TIMESTAMPTZ NOT NULL,
	all_day BOOLEAN NOT NULL DEFAULT false,
	location TEXT,
	notes TEXT,
	timezone TEXT NOT NULL DEFAULT 'UTC',
	is_deleted BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT chk_event_time CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_cal_ws_starts ON calendar_events(workspace_id, starts_at) WHERE is_deleted = false;
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS calendar_events CASCADE;
-- COMMIT;
