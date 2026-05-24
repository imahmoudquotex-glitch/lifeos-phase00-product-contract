BEGIN;

-- Zenith UI user preferences: theme, accent color, reduce-motion
-- Phase 05, migration 0203

CREATE TABLE IF NOT EXISTS zenith_ui_preferences (
	user_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
	workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	theme        TEXT NOT NULL DEFAULT 'dark'
		CHECK (theme = 'dark'),            -- Dark mode only in MVP (ADR-0010)
	accent_color TEXT NOT NULL DEFAULT 'violet'
		CHECK (accent_color IN ('violet', 'cyan', 'emerald', 'rose', 'amber')),
	reduce_motion BOOLEAN NOT NULL DEFAULT false,
	updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE zenith_ui_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE zenith_ui_preferences FORCE ROW LEVEL SECURITY;

CREATE POLICY zenith_ui_self ON zenith_ui_preferences
	FOR ALL
	USING (
		user_id      = current_setting('app.user_id', true)::uuid
		AND workspace_id = current_setting('app.workspace_id', true)::uuid
	);

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0203', '05', now());

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS zenith_ui_preferences;
-- DELETE FROM schema_migrations WHERE version = '0203';
-- COMMIT;
