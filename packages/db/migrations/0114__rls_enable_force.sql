-- File: 0114__rls_enable_force.sql
-- Phase: 02
-- Description: Enable + FORCE RLS on every tenant table.
-- Idempotent: YES
BEGIN;

ALTER TABLE workspaces             ENABLE  ROW LEVEL SECURITY;
ALTER TABLE workspaces             FORCE   ROW LEVEL SECURITY;
ALTER TABLE workspace_memberships  ENABLE  ROW LEVEL SECURITY;
ALTER TABLE workspace_memberships  FORCE   ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations  ENABLE  ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations  FORCE   ROW LEVEL SECURITY;
ALTER TABLE workspace_audit_events ENABLE  ROW LEVEL SECURITY;
ALTER TABLE workspace_audit_events FORCE   ROW LEVEL SECURITY;
ALTER TABLE pages                  ENABLE  ROW LEVEL SECURITY;
ALTER TABLE pages                  FORCE   ROW LEVEL SECURITY;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   ALTER TABLE pages                  DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE pages                  NO FORCE ROW LEVEL SECURITY;
--   ALTER TABLE workspace_audit_events DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE workspace_audit_events NO FORCE ROW LEVEL SECURITY;
--   ALTER TABLE workspace_invitations  DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE workspace_invitations  NO FORCE ROW LEVEL SECURITY;
--   ALTER TABLE workspace_memberships  DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE workspace_memberships  NO FORCE ROW LEVEL SECURITY;
--   ALTER TABLE workspaces             DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE workspaces             NO FORCE ROW LEVEL SECURITY;
-- COMMIT;
