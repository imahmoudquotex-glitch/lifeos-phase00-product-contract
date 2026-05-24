# ADR 0013 — Vault: Metadata vs Crypto Separation

## Status
Accepted

## Context
Vault items require both searchable metadata (type, tags) and encrypted content (plaintext secrets). The crypto layer (KMS, DEK wrapping, AEAD) is not yet designed in Phase 03.

## Decision
### Phase 03 (now)
`vault_items` stores metadata only:
- `item_type` — password | note | card | identity | file_ref
- `title_hash` — SHA-256 hash of the title (not plaintext)
- `tags` — searchable labels

### Phase 04 (deferred)
Add columns:
- `encrypted_blob BYTEA` — AEAD-encrypted content
- `nonce BYTEA` — encryption nonce
- `wrapped_dek BYTEA` — DEK wrapped with master key
- `dek_kdf_salt BYTEA` — KDF salt for DEK derivation

### RLS
Vault RLS requires **both** `workspace_id` AND `owner_user_id` — stricter than all other tables. Not even admin role can read another user's vault items.

## Consequences
- ✅ Phase 03 safe to ship without KMS
- ✅ Clear separation between metadata (Phase 03) and crypto (Phase 04)
- ✅ Owner-only RLS enforced at DB level
- ❌ Title is not searchable by plaintext until Phase 04 decrypts it
- ❌ Vault is read-only in UI until Phase 04 adds create/decrypt routes
