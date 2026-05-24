-- File: 0103__identity_password_resets.sql
-- Phase: 02
-- Description: One-time password-reset tokens.
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  consumed_at     TIMESTAMPTZ,
  CONSTRAINT chk_pwreset_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_pwreset_user_active
  ON password_reset_tokens(user_id) WHERE consumed_at IS NULL;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_pwreset_user_active;
--   DROP TABLE IF EXISTS password_reset_tokens;
-- COMMIT;
