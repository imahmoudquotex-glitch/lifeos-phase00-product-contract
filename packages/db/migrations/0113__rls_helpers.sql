-- File: 0113__rls_helpers.sql
-- Phase: 02
-- Description: Stable SQL helpers used inside RLS policies.
-- Idempotent: YES
BEGIN;

CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION app_current_workspace_id() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.current_workspace_id', true), '')
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION app_is_member(_workspace_id TEXT) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_memberships m
     WHERE m.workspace_id = _workspace_id
       AND m.user_id = app_current_user_id()
       AND m.removed_at IS NULL
  )
$$ LANGUAGE SQL STABLE;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP FUNCTION IF EXISTS app_is_member(TEXT);
--   DROP FUNCTION IF EXISTS app_current_workspace_id();
--   DROP FUNCTION IF EXISTS app_current_user_id();
-- COMMIT;
