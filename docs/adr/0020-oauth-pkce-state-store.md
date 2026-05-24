# ADR-0020 — OAuth: PKCE S256 + DB-Backed State Store

**Status:** Accepted
**Phase:** 04
**Date:** 2026-05-24

## Decision

PKCE (S256 method) is mandatory for all OAuth flows. The `state` nonce is stored in `oauth_state_store` table with:
- TTL: 10 minutes (`OAUTH_STATE_TTL_MINUTES`)
- Consume-once: `consumed_at` is set on first use; subsequent attempts are rejected
- No RLS: pre-auth table; protected by TTL + consume-once logic

## Alternatives Rejected

- **Implicit state in cookie**: Stateless but forgeable without server-side verification.
- **Redis TTL store**: Additional infrastructure dependency; Postgres is already present.

## Consequences

- Requires periodic cleanup job to purge expired rows.
- PKCE `code_verifier` is stored server-side until exchange; then discarded.
