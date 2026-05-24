-- File: 0134__vault_items_metadata.sql
-- Phase: 03
-- Description: Vault items METADATA ONLY. Encrypted blob columns added in Phase 04.
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS vault_items (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	owner_user_id TEXT NOT NULL REFERENCES users(id),
	item_type TEXT NOT NULL CHECK (item_type IN ('password','note','card','identity','file_ref')),
	title_hash TEXT NOT NULL,
	tags TEXT[] NOT NULL DEFAULT '{}',
	is_deleted BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vault_ws_owner ON vault_items(workspace_id, owner_user_id) WHERE is_deleted = false;
-- NOTE (Phase 04): these columns will be ADDED in future migrations:
--   encrypted_blob BYTEA NOT NULL
--   nonce BYTEA NOT NULL
--   wrapped_dek BYTEA NOT NULL
--   dek_kdf_salt BYTEA NOT NULL
COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS vault_items CASCADE;
-- COMMIT;
