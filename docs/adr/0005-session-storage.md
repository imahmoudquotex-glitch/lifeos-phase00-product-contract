# ADR 0005 — Server-Side Session Storage

- Status: Accepted
- Date: 2026-01-12
- Owner: platform team
- Supersedes: —

## Context

The system must maintain user login state across requests. Two mainstream approaches are:
1. **Stateless JWTs** — signed tokens, decoded client-side, no server storage.
2. **Server-side sessions** — opaque token referencing a server-stored record.

Constraints driving this decision:
- **Instant revocation is required**: when an admin suspends a user, all their active sessions must become invalid immediately — impossible with JWTs unless a blocklist (which re-introduces server state) is maintained.
- **No localStorage**: browser security best-practice forbids storing auth tokens in JavaScript-accessible storage (XSS risk).
- **Audit requirements**: IP address and User-Agent must be captured per session for the workspace audit log — JWT payloads grow unbounded if these are included.
- **Privilege change safety**: when a user's workspace role changes (e.g. transfer-ownership), their session context must reflect the new role on the very next request.

## Decision

Store sessions server-side in the `sessions` table (PostgreSQL). Each session:
- Is identified by an opaque, cryptographically random token (`crypto.randomBytes(32)` → base64url).
- Is peppered with `SESSION_PEPPER` (env var, ≥ 32 chars) before storage — pepper is never written to DB, invalidating all sessions if the DB is compromised.
- Has a `last_seen_at` timestamp throttled to 5-minute writes to reduce UPDATE pressure.
- Has a `expires_at` driven by `SESSION_TTL_DAYS` (default: 30 days).
- Is delivered via `HttpOnly; Secure; SameSite=Lax` cookie named `SESSION_COOKIE_NAME`.

## Alternatives Considered

- **Stateless JWT** — rejected because revocation requires a blocklist (server state anyway), and payload inflation to carry IP/UA breaks size limits on cookie JWTs.
- **Redis session store** — rejected because it introduces an additional infrastructure dependency in Phase 02. Postgres is already the single source of truth. Revisit in Phase 06 if session lookup becomes a bottleneck.
- **Opaque token in localStorage** — rejected outright; violates XSS security baseline.

## Consequences

- **Positive**: trivial revocation (DELETE FROM sessions WHERE id = $1); audit metadata captured cheaply; no JWT secret rotation ceremony.
- **Positive**: `last_seen_at` write throttle keeps session lookup cheap even under high request volume.
- **Negative**: every authenticated request requires a DB round-trip (`SELECT ... FROM sessions WHERE token_hash = $1`). Mitigated by index on token_hash and optional caching in Phase 06.
- **Negative**: horizontal scale requires shared Postgres (not in-memory per node). Acceptable for the monolith phase.
- **CI enforcement**: `session-lifecycle.test.ts` covers create / validate / revoke / expire paths. `password-hash.test.ts` covers pepper application.

## Links

- Related code: `packages/auth/src/session.ts`
- Related migration: `0101__sessions.sql`
- ADR 0006 (RLS context) depends on session token providing `userId` for GUC injection.
