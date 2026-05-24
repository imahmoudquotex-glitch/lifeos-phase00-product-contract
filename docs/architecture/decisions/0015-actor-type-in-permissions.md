# ADR 0015 — Actor Type in @lifeos/permissions

## Status
Accepted

## Context
Multiple service packages need to know the authenticated user's identity, workspace, and role. Defining this type in each service creates drift and makes capability checking inconsistent.

## Decision
```typescript
// packages/permissions/src/actor.ts
export type Actor = {
  readonly userId: string;
  readonly workspaceId: string;
  readonly role: 'owner' | 'admin' | 'member' | 'guest';
  readonly capabilities?: ReadonlyArray<string>;
};
```

All services import:
```typescript
import { assertCapability, type Actor } from '@lifeos/permissions';
```

`assertCapability(actor, 'task:create')` throws `AppError('AUTH_FORBIDDEN')` if the actor's role doesn't have the capability.

## Role → Capabilities Matrix (Phase 03)
| Role | All caps | Excludes |
|---|---|---|
| owner | All | — |
| admin | All | `workspace:delete` |
| member | Write | `budget:set`, `workspace:*`, `vault:create-meta`, `import:start`, `share:revoke` |
| guest | Read-only | Most write ops |

## Consequences
- ✅ Single source of truth for Actor and capabilities
- ✅ All services get typed Actor + capability checking from one import
- ✅ Adding a new capability only requires updating `capabilities.ts`
- ❌ Capability names are strings — typos caught at test time, not compile time
