import { db } from '@lifeos/db';
import { AppError } from '@lifeos/shared/errors';

/**
 * Enforces RLS context for the duration of the callback.
 * This is the ONLY approved way to run tenant-scoped queries in the backend.
 */
export async function withWorkspaceContext<T>(
  userId: string,
  workspaceId: string,
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Set RLS variables
    await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);
    await client.query(`SELECT set_config('app.current_workspace_id', $1, true)`, [workspaceId]);
    
    // Verify membership
    const memCheck = await client.query(`SELECT app_is_member($1) as is_member`, [workspaceId]);
    if (!memCheck.rows[0]?.is_member) {
      throw new AppError('AUTH_FORBIDDEN', 'User is not a member of this workspace');
    }
    
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
