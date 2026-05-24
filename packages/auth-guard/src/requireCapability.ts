import { assertCapability } from '@lifeos/permissions/resolver';
import type { WorkspaceRole } from '@lifeos/permissions/capabilities';
import type { Capability } from '@lifeos/permissions/capabilities';

export function requireCapability(subject: WorkspaceRole, capability: Capability): void {
  assertCapability(subject, capability);
}
