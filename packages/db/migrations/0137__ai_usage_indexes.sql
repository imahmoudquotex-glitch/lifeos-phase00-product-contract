-- File: 0137__ai_usage_indexes.sql
-- Phase: 03
-- Description: AI usage events indexes.
-- Idempotent: YES
BEGIN;
CREATE INDEX IF NOT EXISTS idx_ai_usage_ws_month ON ai_usage_events(workspace_id, date_trunc('month', created_at));
CREATE INDEX IF NOT EXISTS idx_ai_usage_ws_status ON ai_usage_events(workspace_id, status);
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_ai_usage_ws_status;
-- DROP INDEX IF EXISTS idx_ai_usage_ws_month;
-- COMMIT;
