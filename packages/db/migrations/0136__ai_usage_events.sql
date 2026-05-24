-- File: 0136__ai_usage_events.sql
-- Phase: 03
-- Description: AI usage events ledger with idempotency key.
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS ai_usage_events (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	user_id TEXT NOT NULL REFERENCES users(id),
	idempotency_key TEXT NOT NULL,
	tokens_reserved BIGINT NOT NULL CHECK (tokens_reserved >= 0),
	tokens_used BIGINT CHECK (tokens_used IS NULL OR tokens_used >= 0),
	status TEXT NOT NULL CHECK (status IN ('reserved','completed','refunded')),
	model TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	completed_at TIMESTAMPTZ,
	CONSTRAINT uq_ai_usage_idem UNIQUE (workspace_id, idempotency_key)
);
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS ai_usage_events CASCADE;
-- COMMIT;
