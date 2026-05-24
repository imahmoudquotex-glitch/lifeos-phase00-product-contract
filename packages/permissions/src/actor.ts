import type { WorkspaceRole, Capability } from './capabilities';
import { ROLE_CAPABILITIES } from './capabilities';

/**
 * Represents the authenticated principal making a request.
 *
 * ADR 0015: Actor carries enough identity to build a complete audit trail,
 * including optional delegated-action context for system-initiated operations.
 *
 * Discriminated union allows safe narrowing:
 *   if (actor.kind === 'user') { /* actor.userId is available * / }
 */
export type Actor =
  | UserActor
  | SystemActor;

export interface UserActor {
  kind: 'user';
  /** Stable user UUID from the users table. */
  userId: string;
  /** Workspace the request is scoped to. */
  workspaceId: string;
  /** Role the actor holds in this workspace. */
  role: WorkspaceRole;
  /**
   * When a system process acts on behalf of a real user,
   * delegatedBy carries that user's ID for audit lineage.
   */
  delegatedBy?: string;
}

export interface SystemActor {
  kind: 'system';
  /**
   * Logical name of the system process (e.g. 'cron:xp-rollup', 'webhook:stripe').
   * Used in audit_logs.actor_id when there is no real user.
   */
  systemId: string;
  workspaceId: string;
}

// ─── Type guards ────────────────────────────────────────────────────────────

export function isUserActor(actor: Actor): actor is UserActor {
  return actor.kind === 'user';
}

export function isSystemActor(actor: Actor): actor is SystemActor {
  return actor.kind === 'system';
}

// ─── Capability helpers ───────────────────────────────────────────────────

/**
 * Returns true if the actor has the given capability in their workspace role.
 * System actors are considered to have all capabilities.
 */
export function actorHasCapability(actor: Actor, cap: Capability): boolean {
  if (actor.kind === 'system') return true;
  return ROLE_CAPABILITIES[actor.role].includes(cap);
}

/**
 * Returns true if the actor is the owner of their workspace.
 */
export function isOwnerActor(actor: Actor): boolean {
  return actor.kind === 'user' && actor.role === 'owner';
}

// ─── Factory helpers ──────────────────────────────────────────────────────

/** Build a UserActor from a validated session + membership lookup result. */
export function actorFromSession(params: {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  delegatedBy?: string;
}): UserActor {
  return {
    kind: 'user',
    userId: params.userId,
    workspaceId: params.workspaceId,
    role: params.role,
    ...(params.delegatedBy ? { delegatedBy: params.delegatedBy } : {}),
  };
}

/** Build a SystemActor for background jobs and cron tasks. */
export function actorFromSystem(systemId: string, workspaceId: string): SystemActor {
  return { kind: 'system', systemId, workspaceId };
}
