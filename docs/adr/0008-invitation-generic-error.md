# ADR 0008 — Invitation Generic Error + Workspace Non-Member 404

- Status: Accepted
- Date: 2026-01-12
- Owner: platform team
- Supersedes: —

## Context

Two related enumeration attack surfaces exist in the invitation + workspace-membership flow:

**Invitation enumeration**: when an invitation token is submitted, the system knows which of five states is true:
1. Token does not exist.
2. Token has expired.
3. Token has already been accepted.
4. Token has been revoked by an admin.
5. The invitee email does not match the session user's email.

Returning distinct errors for each state leaks which workspaces exist, whether a given email was invited, and whether an invitation is still open. An attacker can use these signals to enumerate workspace memberships.

**Workspace non-member 403**: routes that return HTTP 403 on membership failure confirm that the workspace *exists* but the caller lacks access. A 404 is indistinguishable from "workspace doesn't exist", preventing enumeration.

## Decision

**Invitation**: all five internal failure states are collapsed into a single generic error surfaced as:
```
AppError('INVITATION_INVALID', 'Invitation link is invalid or has expired.')
```
`invitationGenericError()` is a **factory function** (not a singleton constant). Each call site constructs a fresh `AppError` instance to prevent request-scoped state (stack traces, metadata) leaking across concurrent requests.

**Workspace membership HTTP mapping**: `requireWorkspace()` throws `AppError('WORKSPACE_NOT_FOUND', ...)` for non-members. The API error handler maps `WORKSPACE_NOT_FOUND` → HTTP 404. Callers cannot distinguish "workspace doesn't exist" from "you're not a member".

`withWorkspaceRoute()` enforces this mapping: `AUTH_FORBIDDEN` from capability checks (role-level, post-membership-confirmation) still surfaces as HTTP 403, but non-membership always gives 404.

## Alternatives Considered

- **Distinct error codes per invitation state** — rejected because each code is an information oracle. Even "INVITATION_EXPIRED" tells an attacker the workspace existed and the email was invited at some point.
- **Singleton `INVITATION_INVALID` constant** — rejected because a shared `AppError` object's stack trace and metadata are set at construction time and would reflect the first call site, confusing error tracking (Sentry, etc.) when the same instance is thrown from multiple request paths.
- **403 for non-member workspace access** — rejected per the enumeration argument above. 403 confirms workspace existence.

## Consequences

- **Positive**: invitation + workspace membership flows are opaque to unauthenticated callers and non-members.
- **Positive**: factory function ensures each thrown error has a unique, correct stack trace — simpler debugging in Sentry/logs.
- **Negative**: operators lose granular insight into why an invitation failed from the API response alone. They must consult server logs (where the true state IS logged before the generic error is thrown).
- **CI enforcement**: `invitation-generic-error.test.ts` verifies all 5 internal states return identical `AppError('INVITATION_INVALID', ...)`. `requireWorkspace.test.ts` verifies non-member → 404.

## Links

- Related code: `packages/workspaces/src/invitation.ts` (`invitationGenericError()`)
- Related code: `packages/auth-guard/src/requireWorkspace.ts`, `packages/auth-guard/src/withWorkspaceRoute.ts`
- ADR 0009 (transfer ownership): same 404-over-403 principle applies to ownership transfer routes.
