import type { WorkspaceRole, Capability } from './capabilities.js';
import { ROLE_CAPABILITIES } from './capabilities.js';
import { AppError } from '@lifeos/shared';
import type { Actor } from './actor.js';

export function hasCapability(role: WorkspaceRole, cap: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(cap);
}

/**
 * Assert that an Actor has the given capability.
 * SystemActors have all capabilities; UserActors are checked by their role.
 * Accepts Actor directly so services don't have to extract actor.role.
 */
export function assertCapability(actor: Actor | WorkspaceRole, cap: Capability): void {
  if (typeof actor === 'object' && 'kind' in actor) {
    // Actor union
    if (actor.kind === 'system') return; // system has all capabilities
    if (!hasCapability(actor.role, cap)) {
      throw new AppError('AUTH_FORBIDDEN', `Missing capability: ${cap}`);
    }
  } else {
    // Legacy call with raw WorkspaceRole string
    if (!hasCapability(actor as WorkspaceRole, cap)) {
      throw new AppError('AUTH_FORBIDDEN', `Missing capability: ${cap}`);
    }
  }
}
