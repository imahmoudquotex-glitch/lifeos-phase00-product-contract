-- File: 0115__rls_policies_workspaces.sql
-- Phase: 02
-- Description: A user sees only workspaces they belong to.
-- Idempotent: YES
BEGIN;

DROP POLICY IF EXISTS p_workspaces_member_read ON workspaces;
CREATE POLICY p_workspaces_member_read ON workspaces
  FOR SELECT
  USING (app_is_member(id));

DROP POLICY IF EXISTS p_workspaces_owner_write ON workspaces;
CREATE POLICY p_workspaces_owner_write ON workspaces
  FOR UPDATE
  USING (id = app_current_workspace_id() AND app_is_member(id))
  WITH CHECK (id = app_current_workspace_id() AND app_is_member(id));

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP POLICY IF EXISTS p_workspaces_owner_write ON workspaces;
--   DROP POLICY IF EXISTS p_workspaces_member_read ON workspaces;
-- COMMIT;
