# ADR-0029 — Rate Limiting: IP+Email Composite Bucket Strategy

**Status:** Accepted  
**Phase:** 05  
**Date:** 2026-05-24

## Context

Auth endpoints (signin, signup, reset) are prime targets for brute-force attacks. A naive IP-only bucket is easy to evade by rotating IPs. A naive email-only bucket enables user-enumeration-aided lockouts.

## Decision

Composite bucket: `sha256(ip:email.toLowerCase())` → stored in `rate_limit_buckets` table.

| Parameter | Value |
|-----------|-------|
| Signin max attempts | 5 per 15 minutes |
| Signin lockout | 1 hour |
| Signup max attempts | 3 per hour |
| Signup lockout | 2 hours |
| Reset max attempts | 3 per hour |
| Reset lockout | 1 hour |

**Implementation:** `withRateLimit(cfg)(handler)` HOC from `@lifeos/web-guards`.

**Lockout response:** `423 Locked` with `Retry-After` header in seconds.

**Key storage:** `rate_limit_buckets.bucket_key` = SHA-256 of `{prefix}:{ip}:{email}` — not the raw composite (privacy preservation).

**On success:** bucket record is deleted (reset after successful auth).

## Consequences

- No per-user lockout without a known email (prevents credential enumeration attacks)
- `bucket_kind` column (migration 0201) enables per-kind audit/reporting
- Redis is NOT used — Postgres `FOR UPDATE` provides sufficient serialization for MVP scale
- Phase 07: Redis migration if p99 > 50ms on rate-limit check
