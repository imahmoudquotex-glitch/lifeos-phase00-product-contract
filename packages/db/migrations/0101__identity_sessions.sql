-- File: 0101__identity_sessions.sql
-- Phase: 02
-- Description: Server-side sessions (opaque cookie token; HMAC-SHA256 hash stored in DB).
-- ADR-0013: id = token_hash (not a ULID). The raw token never touches the DB.
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY,                       -- HMAC-SHA256(SESSION_PEPPER, rawToken)
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,                   -- same as id (kept for query compatibility)
  user_agent      TEXT,
  ip_inet         INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  CONSTRAINT chk_sessions_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_active
  ON sessions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_expires
  ON sessions(expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_last_seen
  ON sessions(last_seen_at) WHERE revoked_at IS NULL;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_sessions_last_seen;
--   DROP INDEX IF EXISTS idx_sessions_expires;
--   DROP INDEX IF EXISTS idx_sessions_user_active;
--   DROP TABLE IF EXISTS sessions;
-- COMMIT;
