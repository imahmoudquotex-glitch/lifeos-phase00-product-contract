# ADR-0026 — `signInWithPassword` Facade in @lifeos/auth

**Status:** Accepted  
**Phase:** 05  
**Date:** 2026-05-24

## Context

Phase 02 built the auth primitives: `hashPassword`, `verifyPassword`, `createSession`. Phase 04 built the audit chain. However, no composed entry-point existed — callers had to manually chain all three plus the audit write. This led to P04 route handlers duplicating logic.

## Decision

A `signInWithPassword(email, password, deviceFingerprint, userAgent)` facade in `packages/auth/src/sign-in-with-password.ts` composes:
1. User lookup (with email normalization + is_deleted guard)
2. `verifyPassword` check
3. `createSession`
4. Audit event write with hash chain (ADR-0019)
5. Returns `{ sessionId, userId, workspaceId, locale }`

Route handlers call ONE function. Primitives are never called directly in routes.

## Consequences

- Auth route handlers are thinner and easier to audit
- All auth-related DB writes are in one transaction boundary
- Adding 2FA in Phase 07 means extending this facade only, not all callers
- Same pattern applied to `signUp` and `resetPassword`

## Non-goals

- Does NOT include rate limiting (that's withRateLimit HOC — ADR-0029)
- Does NOT include CSRF (that's withCsrfProtection HOC — ADR-0027)
