import { AppError } from '@lifeos/shared';
import { assertCapability } from '@lifeos/permissions/resolver';
import type { Capability, WorkspaceRole } from '@lifeos/permissions/capabilities';

/**
 * Phase 02 requireCapability — Phase 02 contract.
 *
 * assertCapability accepts Actor | WorkspaceRole.
 * Here we construct a minimal Actor-compatible object so it goes through
 * the proper role → capability resolution path.
 *
 * Called inside withWorkspaceRoute AFTER membership is confirmed so
 * workspaceId and userId are always present.
 */
export function requireCapability(
  subject: { userId: string; workspaceId: string; role: WorkspaceRole },
  capability: Capability,
): void {
  // Pass full actor-like object so assertCapability uses the Actor union path
  assertCapability(
    { kind: 'user', userId: subject.userId, workspaceId: subject.workspaceId, role: subject.role },
    capability,
  );
}
