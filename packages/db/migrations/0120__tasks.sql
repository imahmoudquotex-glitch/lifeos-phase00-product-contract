-- File: 0120__tasks.sql
-- Phase: 03
-- Description: Tasks domain table.
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS tasks (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	created_by TEXT NOT NULL REFERENCES users(id),
	title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
	description TEXT,
	status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','cancelled')),
	priority SMALLINT NOT NULL DEFAULT 2 CHECK (priority BETWEEN 0 AND 3),
	due_at TIMESTAMPTZ,
	completed_at TIMESTAMPTZ,
	parent_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
	is_deleted BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS tasks CASCADE;
-- COMMIT;
