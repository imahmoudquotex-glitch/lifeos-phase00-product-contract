# ADR-0027 — `withCsrfProtection` HOC Pattern

**Status:** Accepted  
**Phase:** 05  
**Date:** 2026-05-24

## Context

Phase 04 audit found that `verifyCsrf` was called inconsistently — some routes called it, others forgot. The call is easy to omit silently.

## Decision

All mutating routes (POST/PUT/PATCH/DELETE) MUST be wrapped with `withCsrfProtection(handler)` HOC from `@lifeos/web-guards`.

```typescript
export const POST = withCsrfProtection(handler);
```

The HOC:
1. Reads `lifeos_csrf` cookie (double-submit pattern)
2. Reads `x-csrf-token` header (sent by client JS)
3. Calls `verifyCsrf({ cookieToken, bodyToken: headerToken })`
4. Returns 403 on mismatch, calls handler on success
5. Skips check for safe methods (GET/HEAD/OPTIONS)

**Forbidden pattern:**
```typescript
// ❌ Never do this in a route handler:
const ok = verifyCsrf({ cookieToken, bodyToken: headerToken });
```

## Consequences

- CSRF protection is opt-out impossible (must explicitly remove wrapper to disable)
- CI check `pnpm typecheck` will catch missing exports
- All Phase 05 auth routes are wrapped
- Phase 06+ routes MUST use this pattern
