-- File: 0105__identity_oauth_accounts.sql
-- Phase: 02
-- Description: External OAuth account linking. Full provider flow lives in Phase 04.
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL
                  CHECK (provider IN ('google','github','microsoft')),
  provider_user_id TEXT NOT NULL,
  email_at_link   CITEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user ON oauth_accounts(user_id);

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_oauth_user;
--   DROP TABLE IF EXISTS oauth_accounts;
-- COMMIT;
