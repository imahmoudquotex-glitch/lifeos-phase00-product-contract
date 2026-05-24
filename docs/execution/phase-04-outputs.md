# Phase 04 Outputs (V1.1)

## A. Migrations Applied
0148..0157 (10 migrations). `schema_migrations` rows with `phase='04'`:

| Version | Migration Name |
|---|---|
| 0148 | vault_items_encrypted |
| 0149 | audit_chain_db_hash |
| 0150 | oauth_state_store |
| 0151 | csp_reports |
| 0152 | csrf_tokens |
| 0153 | push_subscriptions |
| 0154 | device_registry |
| 0155 | outbox_dead_letter |
| 0156 | rls_pack_phase04 |
| 0157 | lookup_public_share_fn |

**Next available migration number: 0158.**  
**Reserved for Phase 04 patches: 0158..0199.**  
**Reserved for Phase 05: 0200..0299.**

## B. New Workspace Packages

| Package | Description |
|---|---|
| `@lifeos/vault-crypto` | XChaCha20-Poly1305 + Argon2id envelope encryption |
| `@lifeos/security` | CSP, CSRF, audit-chain, scanner, oauth-state |
| `@lifeos/offline` | outbox, body-hash, backoff |

## C. New AppError Codes (11)

| Code | HTTP Status | Package |
|---|---|---|
| `VAULT_DECRYPT_FAILED` | 500 | vault-crypto |
| `VAULT_MASTER_KEY_INVALID` | 400 | vault-crypto |
| `VAULT_ITEM_KEY_INVALID` | 400 | vault-crypto |
| `CSRF_TOKEN_INVALID` | 403 | security |
| `CSRF_TOKEN_MISSING` | 403 | security |
| `CSP_VIOLATION_REPORT` | 400 | security |
| `OFFLINE_NETWORK_UNAVAILABLE` | 503 | offline |
| `OUTBOX_BODY_HASH_MISMATCH` | 400 | offline |
| `AUDIT_CHAIN_BROKEN` | 500 | security |
| `OAUTH_STATE_INVALID` | 400 | security |
| `OAUTH_STATE_EXPIRED` | 410 | security |

Cumulative total after Phase 04: **30 codes** (19 base + 19 Phase 03 — corrected).

## D. New Tables

- `oauth_state_store`
- `csp_reports`
- `csrf_tokens`
- `push_subscriptions`
- `device_registry`
- `outbox_dead_letter`

## E. Modified Tables

- `vault_items` (+6 columns: ciphertext_b64, nonce_b64, wrapped_item_key_b64, item_key_nonce_b64, aad_b64, crypto_version)
- `workspaces` (+2 columns: vault_master_salt_b64, vault_kdf_params)
- `workspace_audit_events` (+2 columns: prev_hash, event_hash)

## F. New Conventions for Phase 05+

- Use `envelopeOk` (NEVER `okEnvelope`)
- `withWorkspaceRoute(async ({ req, workspaceId, userId, role }) => ...)` — `role` always passed
- `assertCapability` imported from `@lifeos/permissions`
- All offline mutations go through `buildOutboxRecord` (computes bodyHash)
- All audit events written via `computeEventHash(prevHash, ev)` and stored with `event_hash` column
- CSP nonce is read from `x-csp-nonce` request header in Next.js components
- Branch naming: `phase/NN-short-name`. Tag: `phase-NN-locked` (annotated).

## G. ADRs Added

| ADR | Topic |
|---|---|
| 0018 | Vault crypto (XChaCha20 + Argon2id) |
| 0019 | Audit chain DB hash |
| 0020 | OAuth PKCE S256 + DB state store |
| 0021 | CSP strict-dynamic + nonce |
| 0022 | Service Worker offline + body-hash |
| 0023 | Migration range 0148..0199 |

Cumulative ADRs after Phase 04: 8 (Phase 03) + 6 = **14 total**.

## H. CI Gates Activated

- `pnpm check:secrets` (was Phase 01 placeholder — now enforced)
- `pnpm test` covers all 3 new packages
- `pnpm typecheck` enforces 11 new ErrorCodeRegistry entries

## I. Phase 04 Files Map (created)

```
packages/vault-crypto/
├── src/argon2.ts
├── src/xchacha20-poly1305.ts
├── src/master-key.ts
├── src/item-key.ts
├── src/envelope.ts
└── src/index.ts

packages/security/
├── src/csp.ts
├── src/nonce.ts
├── src/csrf.ts
├── src/audit-chain.ts
├── src/scanner.ts
├── src/oauth-state.ts
└── src/index.ts

packages/offline/
├── src/body-hash.ts
├── src/outbox.ts
├── src/backoff.ts
└── src/index.ts

apps/web/
├── middleware.ts            (CSP nonce + security headers)
├── public/sw.js             (Service Worker)
└── app/api/_csp-report/route.ts

scripts/check-no-vault-leak.ts  (activated CI gate)
docs/adr/0018..0023.md
tests/pgtap/0156_rls_phase04.sql
packages/shared/src/errors/codes.ts  (11 new codes added)
packages/shared/src/envelope/envelope.ts  (STATUS_MAP extended)
```
