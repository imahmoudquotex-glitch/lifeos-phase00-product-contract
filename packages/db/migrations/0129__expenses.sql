-- File: 0129__expenses.sql
-- Phase: 03
-- Description: Expenses domain table. All money stored as BIGINT cents (ADR 0010).
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS expenses (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	created_by TEXT NOT NULL REFERENCES users(id),
	amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
	currency CHAR(3) NOT NULL,
	category TEXT NOT NULL,
	description TEXT,
	spent_at DATE NOT NULL,
	is_deleted BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expenses_ws_spent ON expenses(workspace_id, spent_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_expenses_ws_cat ON expenses(workspace_id, category) WHERE is_deleted = false;
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS expenses CASCADE;
-- COMMIT;
