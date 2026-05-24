import { db } from '@lifeos/db';
import type { DbClient } from '@lifeos/db';
import { AppError } from '@lifeos/shared/errors';

/**
 * Enforces RLS context for the duration of the callback.
 * This is the ONLY approved way to run tenant-scoped queries in the backend.
 */
export async function withWorkspaceContext<T>(
  userId: string,
  workspaceId: string,
  callback: (tx: DbClient) => Promise<T>
): Promise<T> {
  return db.tx(async (tx) => {
    // Set RLS variables
    await tx.none(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);
    await tx.none(`SELECT set_config('app.current_workspace_id', $1, true)`, [workspaceId]);
    
    // Verify membership
    const isMember = await tx.oneOrNone<{ is_member: boolean }>(`SELECT app_is_member($1) as is_member`, [workspaceId]);
    if (!isMember || !isMember.is_member) {
      throw new AppError('AUTH_FORBIDDEN', 'User is not a member of this workspace');
    }
    
    return callback(tx);
  });
}
