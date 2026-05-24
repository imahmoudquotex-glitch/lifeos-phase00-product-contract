-- File: 0127__habit_checkins.sql
-- Phase: 03
-- Description: Habit check-ins (append-only, no soft delete).
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS habit_checkins (
	id TEXT PRIMARY KEY,
	habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	user_id TEXT NOT NULL REFERENCES users(id),
	checkin_date DATE NOT NULL,
	note TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT uq_habit_checkin_day UNIQUE (habit_id, user_id, checkin_date)
);
CREATE INDEX IF NOT EXISTS idx_habit_checkins_ws_date ON habit_checkins(workspace_id, checkin_date DESC);
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS habit_checkins CASCADE;
-- COMMIT;
