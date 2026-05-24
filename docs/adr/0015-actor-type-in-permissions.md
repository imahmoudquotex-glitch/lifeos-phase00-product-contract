# ADR 0015 — Actor Type in Permissions Package

- Status: Accepted
- Date: 2026-02-01
- Owner: platform team
- Supersedes: —

## Context

Domain service functions need to identify WHO is performing an action for:
1. **Authorization**: does this principal have the capability required?
2. **Audit logging**: who performed this action, and in what context?
3. **System actions**: some operations are triggered by cron jobs, webhooks, or import workers — not real users.

Early service implementations passed raw `userId: string` and `workspaceId: string` as separate parameters. This approach has problems:
- `userId` alone cannot distinguish "user request" from "system process".
- No place to carry `delegatedBy` (when a system acts on behalf of a user).
- Audit log entries from system processes had no machine-readable identity.

## Decision

Introduce a discriminated union type `Actor` in `packages/permissions/src/actor.ts`:

```typescript
type Actor = UserActor | SystemActor;

interface UserActor {
  kind: 'user';
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  delegatedBy?: string;  // when system acts on behalf of user
}

interface SystemActor {
  kind: 'system';
  systemId: string;  // e.g. 'cron:xp-rollup', 'webhook:stripe'
  workspaceId: string;
}
```

Factory functions produce actors:
- `actorFromSession({ userId, workspaceId, role })` — for authenticated user requests.
- `actorFromSystem(systemId, workspaceId)` — for background jobs and webhooks.

Helper functions:
- `actorHasCapability(actor, cap)` — delegates to ROLE_CAPABILITIES for UserActors; SystemActors have all capabilities.
- `isOwnerActor(actor)` — true iff UserActor with role = 'owner'.
- `isUserActor(actor)`, `isSystemActor(actor)` — type narrowing guards.

All domain service functions that write to `audit_logs` accept `actor: Actor` and serialize it to the audit record.

## Alternatives Considered

- **Pass `userId: string | null` with a separate `isSystem: boolean` flag** — rejected because two separate fields invite bugs (e.g., `isSystem = true` but `userId` is still set). Discriminated union makes invalid states unrepresentable.
- **Separate function signatures for user vs. system** — rejected because it doubles the API surface of every service function that supports both callers.
- **Actor as a class with methods** — rejected in favour of plain interfaces + standalone functions to avoid `instanceof` issues across package boundaries.

## Consequences

- **Positive**: `actor.kind === 'user'` / `actor.kind === 'system'` is a type-safe discriminant — TypeScript narrows the type correctly.
- **Positive**: audit log entries for system actions carry a structured `systemId` rather than a null userId — operations like "XP rollup cron ran for workspace X" are fully traceable.
- **Positive**: `actorHasCapability` provides a unified capability check regardless of actor type, eliminating `if (isSystem) return true` boilerplate in service code.
- **Negative**: all service functions that previously took `userId: string` must be updated to accept `actor: Actor`. This is a one-time migration cost.
- **Negative**: `SystemActor` has no `role` — authorization for system actors is opt-in permissive (all capabilities granted). This is correct for cron jobs but would be dangerous if system actors were user-facing. Not a risk in the current architecture.
- **CI enforcement**: `actor.test.ts` (Phase 03 or 04) verifies type narrowing, factory functions, and `actorHasCapability` for all role combinations.

## Links

- Related code: `packages/permissions/src/actor.ts`
- Related code: `packages/permissions/src/capabilities.ts` (ROLE_CAPABILITIES used by `actorHasCapability`)
- ADR 0006 (RLS context): session GUCs set `app.current_user_id` from `actor.userId`.
- ADR 0009 (transfer ownership): `rotateOnPrivilegeChange` uses actor for audit log.
