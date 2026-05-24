-- File: 0147__outbound_emails.sql
-- Phase: 03
-- Description: Outbound email queue (system-internal, no RLS).
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS outbound_emails (
	id TEXT PRIMARY KEY,
	workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
	to_email TEXT NOT NULL,
	template TEXT NOT NULL,
	payload JSONB NOT NULL DEFAULT '{}'::jsonb,
	status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','suppressed')),
	attempts SMALLINT NOT NULL DEFAULT 0,
	last_error TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_outbound_status ON outbound_emails(status, created_at) WHERE status IN ('queued','failed');
-- No RLS — outbound_emails is system-internal (accessed by mailer worker only)
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS outbound_emails CASCADE;
-- COMMIT;
