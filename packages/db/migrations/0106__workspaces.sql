-- File: 0106__workspaces.sql
-- Phase: 02
-- Description: Top-level tenant boundary.
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS workspaces (
  id              TEXT PRIMARY KEY,                       -- ULID
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'team'
                  CHECK (type IN ('personal','team')),
  owner_user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at     TIMESTAMPTZ,
  CONSTRAINT chk_workspace_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]{0,62}$')
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_active
  ON workspaces(id) WHERE archived_at IS NULL;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_workspaces_active;
--   DROP INDEX IF EXISTS idx_workspaces_owner;
--   DROP TABLE IF EXISTS workspaces;
-- COMMIT;
