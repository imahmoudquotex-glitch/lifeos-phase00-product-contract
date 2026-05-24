-- File: 0102__identity_magic_links.sql
-- Phase: 02
-- Description: One-time magic-link tokens (login without password).
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id              TEXT PRIMARY KEY,                       -- ULID
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  consumed_at     TIMESTAMPTZ,
  ip_inet         INET,
  CONSTRAINT chk_magic_link_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_magic_link_user_active
  ON magic_link_tokens(user_id) WHERE consumed_at IS NULL;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_magic_link_user_active;
--   DROP TABLE IF EXISTS magic_link_tokens;
-- COMMIT;
