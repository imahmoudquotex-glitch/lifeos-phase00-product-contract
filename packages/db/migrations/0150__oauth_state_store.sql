BEGIN;

CREATE TABLE IF NOT EXISTS oauth_state_store (
	state TEXT PRIMARY KEY,
	workspace_id TEXT,
	user_id TEXT,
	provider TEXT NOT NULL,
	pkce_verifier TEXT NOT NULL,
	redirect_to TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	expires_at TIMESTAMPTZ NOT NULL,
	consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_oauth_state_expires ON oauth_state_store(expires_at);

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0150', '04', now())
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS oauth_state_store;
-- DELETE FROM schema_migrations WHERE version='0150';
-- COMMIT;
