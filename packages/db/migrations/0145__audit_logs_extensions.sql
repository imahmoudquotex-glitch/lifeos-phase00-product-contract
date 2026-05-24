-- File: 0145__audit_logs_extensions.sql
-- Phase: 03
-- Description: Audit logs table (CREATE IF NOT EXISTS guard) + Phase 03 extension columns.
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS audit_logs (
	id TEXT PRIMARY KEY,
	workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
	actor_user_id TEXT REFERENCES users(id),
	event_type TEXT NOT NULL,
	payload JSONB NOT NULL DEFAULT '{}'::jsonb,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE audit_logs
	ADD COLUMN IF NOT EXISTS resource_type TEXT,
	ADD COLUMN IF NOT EXISTS resource_id TEXT,
	ADD COLUMN IF NOT EXISTS ip_address INET,
	ADD COLUMN IF NOT EXISTS user_agent TEXT;
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(workspace_id, resource_type, resource_id);
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_audit_resource;
-- ALTER TABLE audit_logs DROP COLUMN IF EXISTS user_agent, DROP COLUMN IF EXISTS ip_address, DROP COLUMN IF EXISTS resource_id, DROP COLUMN IF EXISTS resource_type;
-- COMMIT;
