-- File: 0141__daily_reviews.sql
-- Phase: 03
-- Description: Daily review entries (one per user per day).
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS daily_reviews (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	user_id TEXT NOT NULL REFERENCES users(id),
	review_date DATE NOT NULL,
	mood SMALLINT CHECK (mood BETWEEN 1 AND 5),
	summary_md TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT uq_daily_review UNIQUE (user_id, review_date)
);
ALTER TABLE daily_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reviews FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS daily_reviews_isolation ON daily_reviews;
CREATE POLICY daily_reviews_isolation ON daily_reviews
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS daily_reviews CASCADE;
-- COMMIT;
