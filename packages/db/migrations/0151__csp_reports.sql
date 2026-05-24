BEGIN;

CREATE TABLE IF NOT EXISTS csp_reports (
	id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
	workspace_id TEXT,
	report JSONB NOT NULL,
	user_agent TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csp_reports_workspace ON csp_reports(workspace_id, created_at DESC);

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0151', '04', now())
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS csp_reports;
-- DELETE FROM schema_migrations WHERE version='0151';
-- COMMIT;
