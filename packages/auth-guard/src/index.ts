import { AppError } from '@lifeos/shared/errors';
import { validateSession } from '@lifeos/auth/session';
import { db } from '@lifeos/db';
import { WorkspaceRole, Capability, assertCapability } from '@lifeos/permissions';

export async function requireUser(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/lifeos_sid=([^;]+)/);
  if (!match) throw new AppError('AUTH_REQUIRED', 'Not authenticated');
  
  const token = match[1];
  const session = await validateSession(token);
  if (!session) throw new AppError('AUTH_REQUIRED', 'Invalid or expired session');
  
  return session.userId;
}

export async function requireWorkspace(userId: string, workspaceId: string) {
  const result = await db.query(
    `SELECT role FROM workspace_memberships WHERE user_id = $1 AND workspace_id = $2 AND removed_at IS NULL`,
    [userId, workspaceId]
  );
  if (result.rows.length === 0) {
    throw new AppError('AUTH_FORBIDDEN', 'User is not a member of this workspace');
  }
  return { role: result.rows[0].role as WorkspaceRole };
}

export async function requireWorkspaceCapability(userId: string, workspaceId: string, cap: Capability) {
  const { role } = await requireWorkspace(userId, workspaceId);
  assertCapability(role, cap);
  return role;
}
