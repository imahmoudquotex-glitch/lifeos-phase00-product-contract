import { AppError } from '@lifeos/shared';
import { db } from '@lifeos/db';

export async function requireWorkspace(userId: string, workspaceId: string): Promise<{ role: string }> {
  if (!workspaceId) throw new AppError('VALIDATION_FAILED', 'Workspace ID is required');
  
  const membership = await db.oneOrNone<{ role: string }>(
    `SELECT wm.role 
     FROM workspace_memberships wm
     JOIN workspaces w ON wm.workspace_id = w.id
     WHERE wm.workspace_id = $1 
       AND wm.user_id = $2 
       AND wm.removed_at IS NULL 
       AND w.archived_at IS NULL`,
    [workspaceId, userId]
  );
  
  if (!membership) {
    // ADR 0008: return WORKSPACE_NOT_FOUND (→ 404) — never 403 — to prevent
    // workspace existence enumeration by unauthenticated / non-member callers.
    throw new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found or access denied');
  }
  
  return { role: membership.role };
}
