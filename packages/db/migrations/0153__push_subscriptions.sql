BEGIN;

CREATE TABLE IF NOT EXISTS push_subscriptions (
	id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	endpoint TEXT NOT NULL,
	p256dh_key TEXT NOT NULL,
	auth_key TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	is_deleted BOOLEAN NOT NULL DEFAULT false,
	UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id) WHERE is_deleted = false;

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0153', '04', now())
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS push_subscriptions;
-- DELETE FROM schema_migrations WHERE version='0153';
-- COMMIT;
