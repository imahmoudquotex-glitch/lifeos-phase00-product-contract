-- File: 0108__workspace_invitations.sql
-- Phase: 02
-- Description: Workspace invitations (token-based).
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS workspace_invitations (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email           CITEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('admin','member','viewer')),
  token_hash      TEXT NOT NULL UNIQUE,
  invited_by      TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  accepted_at     TIMESTAMPTZ,
  declined_at     TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  CONSTRAINT chk_invite_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_invitation_workspace_active
  ON workspace_invitations(workspace_id)
  WHERE accepted_at IS NULL AND declined_at IS NULL AND revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invitation_email
  ON workspace_invitations(email);

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_invitation_email;
--   DROP INDEX IF EXISTS idx_invitation_workspace_active;
--   DROP TABLE IF EXISTS workspace_invitations;
-- COMMIT;
