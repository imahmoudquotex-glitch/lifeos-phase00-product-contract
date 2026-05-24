# ADR-0019 — Audit Chain: DB-Stored Hash + Tamper Detection

**Status:** Accepted
**Phase:** 04
**Date:** 2026-05-24

## Decision

Every audit event has `event_hash` and `prev_hash` columns stored in the database. `verifyChain` recomputes each hash from the payload and compares it against the DB-stored `event_hash` — not against `ev.prevHash` alone.

## Why DB-Stored Hash Matters

Trusting `ev.prevHash` as a computed value allows an attacker to tamper with the payload and recompute the hash internally. The defense is comparing against an independently stored DB value: the attacker must rewrite EVERY subsequent `event_hash` row to forge the chain.

## Chain Construction

```
event_hash = SHA-256(prevHash | workspaceId | actorId | eventType | occurredAt | canonical_json(payload))
```

First event uses GENESIS_HASH = `0` * 64.

## Consequences

- INSERT cost: one SHA-256 per audit event (negligible).
- Verification: O(n) reads — acceptable for periodic integrity checks.
- Rollback: `prev_hash`/`event_hash` columns can be dropped cleanly (migration 0149 ROLLBACK footer).
