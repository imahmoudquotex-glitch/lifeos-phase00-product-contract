-- File: 0107__workspace_memberships.sql
-- Phase: 02
-- Description: User membership in a workspace with role.
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS workspace_memberships (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL
                  CHECK (role IN ('owner','admin','member','viewer')),
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at      TIMESTAMPTZ,
  CONSTRAINT uq_membership UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_membership_user_active
  ON workspace_memberships(user_id) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_membership_workspace_active
  ON workspace_memberships(workspace_id) WHERE removed_at IS NULL;

-- Partial-unique to enforce "at least one owner per active workspace":
CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_owner_marker
  ON workspace_memberships(workspace_id)
  WHERE role = 'owner' AND removed_at IS NULL;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS uq_workspace_owner_marker;
--   DROP INDEX IF EXISTS idx_membership_workspace_active;
--   DROP INDEX IF EXISTS idx_membership_user_active;
--   DROP TABLE IF EXISTS workspace_memberships;
-- COMMIT;
