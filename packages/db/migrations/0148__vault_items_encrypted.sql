BEGIN;

ALTER TABLE vault_items
	ADD COLUMN IF NOT EXISTS ciphertext_b64 TEXT,
	ADD COLUMN IF NOT EXISTS nonce_b64 TEXT,
	ADD COLUMN IF NOT EXISTS wrapped_item_key_b64 TEXT,
	ADD COLUMN IF NOT EXISTS item_key_nonce_b64 TEXT,
	ADD COLUMN IF NOT EXISTS aad_b64 TEXT,
	ADD COLUMN IF NOT EXISTS crypto_version SMALLINT NOT NULL DEFAULT 1
		CHECK (crypto_version > 0);

ALTER TABLE workspaces
	ADD COLUMN IF NOT EXISTS vault_master_salt_b64 TEXT,
	ADD COLUMN IF NOT EXISTS vault_kdf_params JSONB NOT NULL DEFAULT '{"alg":"argon2id","m":65536,"t":3,"p":1}'::jsonb;

INSERT INTO schema_migrations (version, phase, applied_at)
VALUES ('0148', '04', now())
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- ALTER TABLE vault_items DROP COLUMN IF EXISTS ciphertext_b64, DROP COLUMN IF EXISTS nonce_b64, DROP COLUMN IF EXISTS wrapped_item_key_b64, DROP COLUMN IF EXISTS item_key_nonce_b64, DROP COLUMN IF EXISTS aad_b64, DROP COLUMN IF EXISTS crypto_version;
-- ALTER TABLE workspaces DROP COLUMN IF EXISTS vault_master_salt_b64, DROP COLUMN IF EXISTS vault_kdf_params;
-- DELETE FROM schema_migrations WHERE version='0148';
-- COMMIT;
