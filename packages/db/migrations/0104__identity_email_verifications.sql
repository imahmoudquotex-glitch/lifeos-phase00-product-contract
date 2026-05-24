-- File: 0104__identity_email_verifications.sql
-- Phase: 02
-- Description: One-time email verification tokens.
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email           CITEXT NOT NULL,
  token_hash      TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  consumed_at     TIMESTAMPTZ,
  CONSTRAINT chk_emailver_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_emailver_user_active
  ON email_verification_tokens(user_id) WHERE consumed_at IS NULL;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_emailver_user_active;
--   DROP TABLE IF EXISTS email_verification_tokens;
-- COMMIT;
