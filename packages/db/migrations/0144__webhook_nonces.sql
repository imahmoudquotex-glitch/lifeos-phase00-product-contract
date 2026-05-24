-- File: 0144__webhook_nonces.sql
-- Phase: 03
-- Description: Webhook nonces for replay protection (global, no RLS).
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS webhook_nonces (
	nonce TEXT PRIMARY KEY,
	provider TEXT NOT NULL,
	received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_webhook_nonces_received ON webhook_nonces(received_at);
-- No RLS — webhook_nonces is global (not tenant-scoped), accessed only by trusted webhook handler
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS webhook_nonces CASCADE;
-- COMMIT;
