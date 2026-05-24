-- File: 0126__habits.sql
-- Phase: 03
-- Description: Habits domain table.
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS habits (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	created_by TEXT NOT NULL REFERENCES users(id),
	title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
	cadence TEXT NOT NULL DEFAULT 'daily' CHECK (cadence IN ('daily','weekly','monthly')),
	target_per_period INTEGER NOT NULL DEFAULT 1 CHECK (target_per_period >= 1),
	is_deleted BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_habits_ws ON habits(workspace_id) WHERE is_deleted = false;
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS habits CASCADE;
-- COMMIT;
