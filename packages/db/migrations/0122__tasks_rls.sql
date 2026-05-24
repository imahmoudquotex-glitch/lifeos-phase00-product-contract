-- File: 0122__tasks_rls.sql
-- Phase: 03
-- Description: Tasks RLS isolation.
-- Idempotent: YES
BEGIN;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tasks_isolation ON tasks;
CREATE POLICY tasks_isolation ON tasks
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP POLICY IF EXISTS tasks_isolation ON tasks;
-- ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
-- COMMIT;
