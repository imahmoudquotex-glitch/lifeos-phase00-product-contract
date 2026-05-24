BEGIN;

-- ADR-0028: user.locale column for i18n strategy
-- Phase 05, migration 0200

ALTER TABLE users
	ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en'
		CHECK (locale IN ('ar', 'en'));

CREATE INDEX IF NOT EXISTS idx_users_locale ON users(locale);

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0200', '05', now());

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_users_locale;
-- ALTER TABLE users DROP COLUMN IF EXISTS locale;
-- DELETE FROM schema_migrations WHERE version = '0200';
-- COMMIT;
