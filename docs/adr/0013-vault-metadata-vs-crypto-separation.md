# ADR 0013 — Vault Metadata vs. Crypto Separation

- Status: Accepted
- Date: 2026-02-01
- Owner: platform team
- Supersedes: —

## Context

The vault feature stores sensitive user data (passwords, API keys, secure notes) encrypted at rest. Implementing this requires two distinct concerns:

1. **Metadata** — item name, type, workspace_id, user_id, created_at, updated_at. Used for listing, searching, and RLS enforcement.
2. **Ciphertext** — the actual secret, encrypted with a key derived from the user's master password or a workspace key.

Phase 03 introduces the vault's DB schema and service layer. However, the encryption library (`@noble/ciphers`) and key derivation (Argon2id or PBKDF2) require careful integration testing and UI key-unlock flow that belongs in Phase 04 alongside the full OAuth implementation.

## Decision

Phase 03 creates the `vault_items_metadata` table with:
- All metadata columns (id, workspace_id, user_id, item_type, name, created_at, updated_at).
- A `ciphertext BYTEA` column that **exists but is NOT populated** — vault write routes return `AppError('NOT_IMPLEMENTED', 'Vault encryption available in a future release')` until Phase 04.
- A `nonce BYTEA` column (IV/nonce for AEAD encryption) — present but nullable until Phase 04.

The RLS policy on `vault_items_metadata` is **more restrictive than other tables**: it requires BOTH:
- `app.current_workspace_id = workspace_id` (workspace-scoped, like other tenant tables)
- `app.current_user_id = user_id` (personal — only the item's creator can read it by default)

Public sharing of vault items requires an explicit `public_shares` record (Phase 03 migration 0143).

## Alternatives Considered

- **Implement encryption in Phase 03** — rejected because encryption wiring requires UI for key unlock (master password prompt), secure key derivation (Argon2id parameters), and in-memory key caching strategy. Doing this correctly alongside 29 other migrations increases risk. Schema-first, crypto-second is safer.
- **Store ciphertext in a separate table** — viable but adds JOIN complexity to every vault read. Since metadata + ciphertext are always fetched together, co-location in one table is simpler.
- **Application-level encryption before DB write (no DB ciphertext column)** — rejected because it makes DB backups useless for recovery (ciphertext not in DB). Ciphertext must be in the DB for point-in-time recovery.

## Consequences

- **Positive**: Phase 03 provides a real RLS-enforced schema with correct column types. Phase 04 only needs to fill in the encryption logic — no schema migration required.
- **Positive**: the dual-context RLS policy (workspace + user) is the strictest in the system, appropriate for personal secrets.
- **Negative**: vault routes are non-functional in Phase 03. API returns `NOT_IMPLEMENTED`. This must be clearly communicated to consumers and the Phase 04 plan.
- **Negative**: `nonce` and `ciphertext` are nullable until Phase 04 writes them — schema allows `NULL` where the application will eventually require values. Phase 04 should add a `CHECK (ciphertext IS NOT NULL)` constraint post-migration.
- **CI enforcement**: `vault.service.test.ts` (Phase 04) will verify encryption round-trip. Phase 03 tests only cover metadata CRUD and RLS isolation.

## Links

- Related migration: `0134__vault_items_metadata.sql`, `0135__vault_rls.sql`
- Related code: `packages/services/src/vault/vault.service.ts` (NOT_IMPLEMENTED stub)
- ADR 0011 (AI quota): similar pattern — DB infrastructure ready, application logic deferred.
- ADR 0015 (actor type): vault RLS uses `app.current_user_id` from the actor.
