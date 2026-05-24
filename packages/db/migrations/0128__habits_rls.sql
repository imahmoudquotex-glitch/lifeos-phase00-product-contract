-- File: 0128__habits_rls.sql
-- Phase: 03
-- Description: Habits and habit_checkins RLS isolation.
-- Idempotent: YES
BEGIN;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS habits_isolation ON habits;
CREATE POLICY habits_isolation ON habits
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));

ALTER TABLE habit_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_checkins FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS habit_checkins_isolation ON habit_checkins;
CREATE POLICY habit_checkins_isolation ON habit_checkins
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP POLICY IF EXISTS habit_checkins_isolation ON habit_checkins;
-- ALTER TABLE habit_checkins DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS habits_isolation ON habits;
-- ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
-- COMMIT;
