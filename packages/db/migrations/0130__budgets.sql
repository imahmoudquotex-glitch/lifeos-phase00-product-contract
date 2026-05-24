-- File: 0130__budgets.sql
-- Phase: 03
-- Description: Budgets per workspace+category. Money as BIGINT cents (ADR 0010).
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS budgets (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	category TEXT NOT NULL,
	monthly_limit_cents BIGINT NOT NULL CHECK (monthly_limit_cents > 0),
	currency CHAR(3) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT uq_budget_ws_cat UNIQUE (workspace_id, category)
);
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS budgets CASCADE;
-- COMMIT;
