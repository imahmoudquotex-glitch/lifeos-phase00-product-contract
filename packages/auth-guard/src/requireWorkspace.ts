import { AppError } from '@lifeos/shared';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';
import type { WorkspaceRole } from '@lifeos/permissions/capabilities';

/**
 * Phase 02 requireWorkspace.
 * Returns 404 WORKSPACE_NOT_FOUND (not 403) for non-members — prevents existence enumeration.
 * Uses DbClient via DI.
 */
export async function requireWorkspace(
  userId: string,
  workspaceId: string,
): Promise<{ role: WorkspaceRole }> {
  if (!workspaceId) throw new AppError('VALIDATION_FAILED', 'Workspace ID is required.');

  const env = getServerEnv();
  const dbClient = getDb(env.DATABASE_URL);

  const membership = await dbClient.oneOrNone<{ role: string }>(
    `SELECT wm.role
     FROM workspace_memberships wm
     JOIN workspaces w ON wm.workspace_id = w.id
     WHERE wm.workspace_id = $1
       AND wm.user_id = $2
       AND wm.removed_at IS NULL
       AND w.archived_at IS NULL`,
    [workspaceId, userId],
  );

  if (!membership) {
    // ADR 0008: 404 to hide workspace existence from non-members
    throw new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found or access denied.');
  }

  return { role: membership.role as WorkspaceRole };
}
