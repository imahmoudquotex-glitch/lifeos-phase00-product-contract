BEGIN;

-- ADR-0028: user.locale column for i18n strategy
-- Phase 05, migration 0200
-- Also adds: suspended_at for account lockout (instead of locked_at)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en'
    CHECK (locale IN ('ar', 'en'));

-- Replaces the incorrect 'locked_at' concept from Phase 05 signInWithPassword.
-- status = 'suspended' is the Phase 02 pattern; suspended_at tracks WHEN it happened.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_locale ON users(locale);

INSERT INTO schema_migrations (version, phase, applied_at)
  VALUES ('0200', '05', now())
  ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_users_locale;
-- ALTER TABLE users DROP COLUMN IF EXISTS suspended_at;
-- ALTER TABLE users DROP COLUMN IF EXISTS locale;
-- DELETE FROM schema_migrations WHERE version = '0200';
-- COMMIT;
