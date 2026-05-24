# ADR-0022 — Service Worker Offline Outbox + Body-Hash Verification

**Status:** Accepted
**Phase:** 04
**Date:** 2026-05-24

## Decision

All offline mutating operations go through an outbox. Each record has:

```
bodyHash = SHA-256-hex(canonical_json(body))
```

Before flushing to network, `verifyOutboxIntegrity(rec)` recomputes `bodyHash` and compares — preventing IndexedDB tampering.

## Canonical JSON

Object keys are sorted recursively before serialization. Arrays are NOT sorted. Primitives/null are serialized as-is.

## Offline Response

When network is unavailable, the Service Worker returns:
```json
{"ok": false, "error": {"code": "OFFLINE_NETWORK_UNAVAILABLE", "message": "No network connection."}}
```
Status: 503. This is the `OFFLINE_NETWORK_UNAVAILABLE` error code (Phase 04 addition).

## Routes Never Cached

`/api/me`, `/api/auth/`, `/api/_csp-report` — always fetched live.
