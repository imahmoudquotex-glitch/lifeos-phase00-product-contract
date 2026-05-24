BEGIN;

-- Performance index for auth.signin.failure audit event queries
-- ADR-0029: lockout tracking requires fast lookup of recent signin failures
-- Phase 05, migration 0204

CREATE INDEX IF NOT EXISTS idx_audit_signin_failures
	ON workspace_audit_events(workspace_id, occurred_at DESC)
	WHERE event_type = 'auth.signin.failure';

-- Also index successful signins for session audit
CREATE INDEX IF NOT EXISTS idx_audit_signin_success
	ON workspace_audit_events(workspace_id, occurred_at DESC)
	WHERE event_type = 'auth.signin.success';

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0204', '05', now());

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_audit_signin_failures;
-- DROP INDEX IF EXISTS idx_audit_signin_success;
-- DELETE FROM schema_migrations WHERE version = '0204';
-- COMMIT;
