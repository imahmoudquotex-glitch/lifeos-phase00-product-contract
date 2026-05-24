-- File: 0119__profiles_extensions.sql
-- Phase: 03
-- Description: Profile fields needed by domain services (timezone, locale).
-- Idempotent: YES
BEGIN;

ALTER TABLE users
	ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC',
	ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en-US',
	ADD COLUMN IF NOT EXISTS display_name TEXT;

-- AI quota limit lives on the workspace row (not application-controlled)
ALTER TABLE workspaces
	ADD COLUMN IF NOT EXISTS monthly_ai_token_limit BIGINT NOT NULL DEFAULT 100000
		CHECK (monthly_ai_token_limit > 0);

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- ALTER TABLE workspaces DROP COLUMN IF EXISTS monthly_ai_token_limit;
-- ALTER TABLE users DROP COLUMN IF EXISTS display_name;
-- ALTER TABLE users DROP COLUMN IF EXISTS locale;
-- ALTER TABLE users DROP COLUMN IF EXISTS timezone;
-- COMMIT;
