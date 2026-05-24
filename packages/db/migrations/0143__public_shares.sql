-- File: 0143__public_shares.sql
-- Phase: 03
-- Description: Public share tokens (hash only, no plaintext).
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS public_shares (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	resource_type TEXT NOT NULL CHECK (resource_type IN ('page','note')),
	resource_id TEXT NOT NULL,
	token_hash TEXT NOT NULL UNIQUE,
	created_by TEXT NOT NULL REFERENCES users(id),
	expires_at TIMESTAMPTZ,
	revoked_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_public_shares_ws_res ON public_shares(workspace_id, resource_type, resource_id);
ALTER TABLE public_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_shares FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_shares_isolation ON public_shares;
CREATE POLICY public_shares_isolation ON public_shares
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS public_shares CASCADE;
-- COMMIT;
