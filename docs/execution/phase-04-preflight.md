# Phase 04 — Preflight

## Gate: phase-03-locked tag

- phase-03-locked tag: ✅ present (sha: 16519a2...)
- phase-03-outputs.md: ✅ present and verified (in docs/execution/)
- global-conventions.md: ✅ readable
- ADRs 0001-0017: ✅ canonical location docs/adr/

## Required new packages (Phase 04 specific)

- `packages/vault-crypto` — XChaCha20-Poly1305 + Argon2id KDF (ADR 0018)
- `packages/security` — CSRF tokens, CSP nonce, audit-chain, scanner, oauth-state
- `packages/offline` — PWA outbox, body-hash, backoff

## Required env additions (Phase 04)

- `VAULT_MASTER_KEY` — 32-byte hex key for envelope wrapping. Required before vault routes go live.
- `OAUTH_STATE_SECRET` — HMAC secret for state token signing (ADR 0020). Required before OAuth routes active.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` — Web Push (migration 0153). Required before push subscriptions active.
- All Phase 03 vars still required.

## DB state required before Phase 04 migrations

- Migrations 0119–0147 applied (Phase 03 baseline verified).
- `reserve_ai_usage` RPC present (migration 0139).
- vault_items_metadata table present with nullable ciphertext column (migration 0134).

## CI checks

- Phase 03 CI was green on phase/03-domain-schemas branch before this phase opened.
- Branch: phase/04-security opened from phase-03-locked tag.

## Open blockers at phase start

- `auth-guard/src/withWorkspaceRoute.ts` — referenced in §2.3, §4.2, §5 of P04 plan but not present. Must be created before route refactors.
- `apps/worker/src/index.ts` — placeholder only (265B). Real outbox consumer deferred to Phase 05.
- E2E tests (auth-flow, page-tree, workspace-isolation) — require HTTP server integration, deferred to Phase 05 with `describe.skip`.

## Migration range allocated

- Phase 03 used: 0119–0147
- Phase 04 allocated: 0148–0199 (used: 0148–0157, 10 migrations)
- Phase 05 available from: 0158
