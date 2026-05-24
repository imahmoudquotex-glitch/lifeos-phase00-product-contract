-- File: 0111__pages.sql
-- Phase: 02
-- Description: Pages tree per workspace (depth <= 50, soft archive, soft delete).
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS pages (
  id              TEXT PRIMARY KEY,                       -- ULID
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id       TEXT REFERENCES pages(id) ON DELETE CASCADE,
  title           TEXT NOT NULL DEFAULT '',
  slug            TEXT NOT NULL,
  position        INT  NOT NULL DEFAULT 0,
  depth           INT  NOT NULL DEFAULT 0,
  created_by      TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at     TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,
  is_deleted      BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT chk_pages_depth_max CHECK (depth >= 0 AND depth <= 50),
  CONSTRAINT uq_pages_workspace_slug UNIQUE (workspace_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_pages_workspace_parent_pos
  ON pages(workspace_id, parent_id, position);
CREATE INDEX IF NOT EXISTS idx_pages_workspace_active
  ON pages(workspace_id) WHERE is_deleted = false AND archived_at IS NULL;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_pages_workspace_active;
--   DROP INDEX IF EXISTS idx_pages_workspace_parent_pos;
--   DROP TABLE IF EXISTS pages;
-- COMMIT;
