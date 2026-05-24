-- File: 0138__ai_usage_rls.sql
-- Phase: 03
-- Description: AI usage events RLS isolation.
-- Idempotent: YES
BEGIN;
ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_usage_isolation ON ai_usage_events;
CREATE POLICY ai_usage_isolation ON ai_usage_events
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP POLICY IF EXISTS ai_usage_isolation ON ai_usage_events;
-- ALTER TABLE ai_usage_events DISABLE ROW LEVEL SECURITY;
-- COMMIT;
