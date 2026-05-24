BEGIN;

CREATE TABLE IF NOT EXISTS outbox_dead_letter (
	id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	original_id TEXT NOT NULL,
	method TEXT NOT NULL,
	url TEXT NOT NULL,
	body TEXT NOT NULL,
	body_hash CHAR(64) NOT NULL,
	attempts INTEGER NOT NULL,
	last_error TEXT,
	failed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dead_letter_workspace ON outbox_dead_letter(workspace_id, failed_at DESC);

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0155', '04', now())
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS outbox_dead_letter;
-- DELETE FROM schema_migrations WHERE version='0155';
-- COMMIT;
