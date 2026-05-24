BEGIN;

ALTER TABLE workspace_audit_events
	ADD COLUMN IF NOT EXISTS prev_hash CHAR(64),
	ADD COLUMN IF NOT EXISTS event_hash CHAR(64);

-- Backfill: existing events get genesis chain.
UPDATE workspace_audit_events
SET prev_hash = repeat('0', 64),
    event_hash = encode(digest(
      concat_ws('|', repeat('0',64), workspace_id::text, actor_id::text, event_type, occurred_at::text, payload::text),
      'sha256'
    ), 'hex')
WHERE event_hash IS NULL;

ALTER TABLE workspace_audit_events
	ALTER COLUMN prev_hash SET NOT NULL,
	ALTER COLUMN event_hash SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_event_hash ON workspace_audit_events(event_hash);

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0149', '04', now())
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_audit_event_hash;
-- ALTER TABLE workspace_audit_events DROP COLUMN IF EXISTS prev_hash, DROP COLUMN IF EXISTS event_hash;
-- DELETE FROM schema_migrations WHERE version='0149';
-- COMMIT;
