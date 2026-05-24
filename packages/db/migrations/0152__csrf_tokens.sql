BEGIN;

CREATE TABLE IF NOT EXISTS csrf_tokens (
	token TEXT PRIMARY KEY,
	session_id TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_csrf_session ON csrf_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_csrf_expires ON csrf_tokens(expires_at);

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0152', '04', now())
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS csrf_tokens;
-- DELETE FROM schema_migrations WHERE version='0152';
-- COMMIT;
