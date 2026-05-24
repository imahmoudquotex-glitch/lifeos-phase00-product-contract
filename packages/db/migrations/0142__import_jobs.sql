-- File: 0142__import_jobs.sql
-- Phase: 03
-- Description: Import jobs table for async data ingestion.
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS import_jobs (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	created_by TEXT NOT NULL REFERENCES users(id),
	source TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed')),
	total_rows INTEGER NOT NULL DEFAULT 0,
	processed_rows INTEGER NOT NULL DEFAULT 0,
	error_message TEXT,
	started_at TIMESTAMPTZ,
	finished_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS import_jobs_isolation ON import_jobs;
CREATE POLICY import_jobs_isolation ON import_jobs
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS import_jobs CASCADE;
-- COMMIT;
