-- File: 0117__rls_policies_pages.sql
-- Phase: 02
-- Description: Page rows isolated by current_workspace_id.
-- Idempotent: YES
BEGIN;

DROP POLICY IF EXISTS p_pages_isolation ON pages;
CREATE POLICY p_pages_isolation ON pages
  USING (workspace_id = app_current_workspace_id())
  WITH CHECK (workspace_id = app_current_workspace_id());

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP POLICY IF EXISTS p_pages_isolation ON pages;
-- COMMIT;
