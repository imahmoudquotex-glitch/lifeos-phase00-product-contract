-- File: 0133__calendar_rls.sql
-- Phase: 03
-- Description: Calendar events RLS isolation.
-- Idempotent: YES
BEGIN;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS calendar_events_isolation ON calendar_events;
CREATE POLICY calendar_events_isolation ON calendar_events
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP POLICY IF EXISTS calendar_events_isolation ON calendar_events;
-- ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;
-- COMMIT;
