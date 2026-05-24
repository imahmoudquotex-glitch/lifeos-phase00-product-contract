import { AppError } from '@lifeos/shared';
import { db } from '@lifeos/db';

export async function requireWorkspace(userId: string, workspaceId: string): Promise<{ role: string }> {
  if (!workspaceId) throw new AppError('VALIDATION_FAILED', 'Workspace ID is required');
  
  const membership = await db.oneOrNone<{ role: string }>(
    `SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2`,
    [workspaceId, userId]
  );
  
  if (!membership) {
    throw new AppError('AUTH_FORBIDDEN', 'User is not a member of this workspace');
  }
  
  return { role: membership.role };
}
