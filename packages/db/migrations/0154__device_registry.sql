BEGIN;

CREATE TABLE IF NOT EXISTS device_registry (
	id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	device_fingerprint TEXT NOT NULL,
	user_agent TEXT,
	first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	revoked_at TIMESTAMPTZ,
	UNIQUE (user_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_device_user ON device_registry(user_id) WHERE revoked_at IS NULL;

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0154', '04', now())
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS device_registry;
-- DELETE FROM schema_migrations WHERE version='0154';
-- COMMIT;
