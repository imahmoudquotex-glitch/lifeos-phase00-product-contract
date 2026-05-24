-- File: 0116__rls_policies_memberships.sql
-- Phase: 02
-- Description: Membership rows visible only within member's own workspaces.
-- Idempotent: YES
BEGIN;

DROP POLICY IF EXISTS p_memberships_isolation ON workspace_memberships;
CREATE POLICY p_memberships_isolation ON workspace_memberships
  USING (app_is_member(workspace_id))
  WITH CHECK (app_is_member(workspace_id));

DROP POLICY IF EXISTS p_invitations_isolation ON workspace_invitations;
CREATE POLICY p_invitations_isolation ON workspace_invitations
  USING (app_is_member(workspace_id))
  WITH CHECK (app_is_member(workspace_id));

DROP POLICY IF EXISTS p_audit_isolation ON workspace_audit_events;
CREATE POLICY p_audit_isolation ON workspace_audit_events
  USING (app_is_member(workspace_id))
  WITH CHECK (app_is_member(workspace_id));

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP POLICY IF EXISTS p_audit_isolation ON workspace_audit_events;
--   DROP POLICY IF EXISTS p_invitations_isolation ON workspace_invitations;
--   DROP POLICY IF EXISTS p_memberships_isolation ON workspace_memberships;
-- COMMIT;
