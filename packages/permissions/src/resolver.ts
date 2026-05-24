import type { WorkspaceRole, Capability } from './capabilities.js';
import { ROLE_CAPABILITIES } from './capabilities.js';
import { AppError } from '@lifeos/shared';

export function hasCapability(role: WorkspaceRole, cap: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(cap);
}

export function assertCapability(role: WorkspaceRole, cap: Capability): void {
  if (!hasCapability(role, cap)) {
    throw new AppError('AUTH_FORBIDDEN', `Missing capability: ${cap}`);
  }
}
