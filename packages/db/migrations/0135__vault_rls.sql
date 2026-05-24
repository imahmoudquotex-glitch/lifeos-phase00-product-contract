-- File: 0135__vault_rls.sql
-- Phase: 03
-- Description: Vault items RLS — workspace isolation + owner-only access.
-- Idempotent: YES
BEGIN;
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vault_items_isolation ON vault_items;
CREATE POLICY vault_items_isolation ON vault_items
	USING (
		workspace_id = current_setting('app.current_workspace_id', true)
		AND owner_user_id = current_setting('app.current_user_id', true)
	)
	WITH CHECK (
		workspace_id = current_setting('app.current_workspace_id', true)
		AND owner_user_id = current_setting('app.current_user_id', true)
	);
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP POLICY IF EXISTS vault_items_isolation ON vault_items;
-- ALTER TABLE vault_items DISABLE ROW LEVEL SECURITY;
-- COMMIT;
