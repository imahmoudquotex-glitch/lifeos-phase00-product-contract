BEGIN;

-- ADR-0029: rate limit bucket kind for auth flow categorization
-- Phase 05, migration 0201
-- NOTE: locked_until_ms already exists in 0146 (added in Phase 03 base table)

ALTER TABLE rate_limit_buckets
  ADD COLUMN IF NOT EXISTS bucket_kind TEXT NOT NULL DEFAULT 'generic'
    CHECK (bucket_kind IN ('generic', 'auth_signin', 'auth_signup', 'auth_reset', 'auth_oauth'));

-- This index now works because locked_until_ms is defined in 0146
CREATE INDEX IF NOT EXISTS idx_rate_limit_kind_locked
  ON rate_limit_buckets(bucket_kind, locked_until_ms)
  WHERE locked_until_ms IS NOT NULL;

INSERT INTO schema_migrations (version, phase, applied_at)
  VALUES ('0201', '05', now())
  ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_rate_limit_kind_locked;
-- ALTER TABLE rate_limit_buckets DROP COLUMN IF EXISTS bucket_kind;
-- DELETE FROM schema_migrations WHERE version = '0201';
-- COMMIT;
