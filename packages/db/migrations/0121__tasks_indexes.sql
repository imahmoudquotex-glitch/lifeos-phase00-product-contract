-- File: 0121__tasks_indexes.sql
-- Phase: 03
-- Description: Tasks indexes.
-- Idempotent: YES
BEGIN;
CREATE INDEX IF NOT EXISTS idx_tasks_ws_status ON tasks(workspace_id, status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_tasks_ws_due ON tasks(workspace_id, due_at) WHERE is_deleted = false AND due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id) WHERE parent_id IS NOT NULL;
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_tasks_parent;
-- DROP INDEX IF EXISTS idx_tasks_ws_due;
-- DROP INDEX IF EXISTS idx_tasks_ws_status;
-- COMMIT;
