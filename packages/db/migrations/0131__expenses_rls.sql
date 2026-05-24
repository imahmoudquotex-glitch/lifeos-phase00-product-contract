-- File: 0131__expenses_rls.sql
-- Phase: 03
-- Description: Expenses and budgets RLS isolation.
-- Idempotent: YES
BEGIN;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS expenses_isolation ON expenses;
CREATE POLICY expenses_isolation ON expenses
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS budgets_isolation ON budgets;
CREATE POLICY budgets_isolation ON budgets
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP POLICY IF EXISTS budgets_isolation ON budgets;
-- ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS expenses_isolation ON expenses;
-- ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
-- COMMIT;
