-- File: 0110__profiles.sql
-- Phase: 02
-- Description: Per-user profile data (separated from auth-critical users table).
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS profiles (
  user_id         TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avatar_url      TEXT,
  bio             TEXT NOT NULL DEFAULT '',
  timezone        TEXT NOT NULL DEFAULT 'UTC',
  locale          TEXT NOT NULL DEFAULT 'en',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP TABLE IF EXISTS profiles;
-- COMMIT;
