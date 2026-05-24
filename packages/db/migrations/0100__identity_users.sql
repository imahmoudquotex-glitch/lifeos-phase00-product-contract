-- File: 0100__identity_users.sql
-- Phase: 02 (Kernel)
-- Description: Core users table — owns email, password hash, status.
-- Idempotent: YES
-- ROLLBACK: see footer.
BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,                       -- ULID
  email           CITEXT NOT NULL UNIQUE,
  email_verified  BOOLEAN NOT NULL DEFAULT false,
  password_hash   TEXT,                                   -- nullable (OAuth-only users)
  display_name    TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','suspended','deleted')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at   TIMESTAMPTZ,
  CONSTRAINT chk_users_email_format CHECK (position('@' in email) > 1)
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE status <> 'deleted';
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(lower(email::text));

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_users_email_lower;
--   DROP INDEX IF EXISTS idx_users_status;
--   DROP TABLE IF EXISTS users;
-- COMMIT;
