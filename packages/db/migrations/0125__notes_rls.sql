-- File: 0125__notes_rls.sql
-- Phase: 03
-- Description: Notes and note_versions RLS isolation.
-- Idempotent: YES
BEGIN;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notes_isolation ON notes;
CREATE POLICY notes_isolation ON notes
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));

ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS note_versions_isolation ON note_versions;
CREATE POLICY note_versions_isolation ON note_versions
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP POLICY IF EXISTS note_versions_isolation ON note_versions;
-- ALTER TABLE note_versions DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS notes_isolation ON notes;
-- ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
-- COMMIT;
