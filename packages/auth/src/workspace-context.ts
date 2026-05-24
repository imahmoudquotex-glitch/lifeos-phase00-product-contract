import type { DbClient } from '@lifeos/db';
import { AppError } from '@lifeos/shared/errors';

/**
 * Enforces RLS context for the duration of the callback.
 * Phase 02: accepts injected DbClient (no global singleton).
 * This is the ONLY approved way to run tenant-scoped queries in the backend.
 *
 * Sets Postgres session-local config vars for RLS policies:
 *   app.current_user_id
 *   app.current_workspace_id
 */
export async function withWorkspaceContext<T>(
  dbClient: DbClient,
  userId: string,
  workspaceId: string,
  callback: (tx: DbClient) => Promise<T>,
): Promise<T> {
  return dbClient.tx(async (tx) => {
    // Set RLS variables for this transaction
    await tx.none(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);
    await tx.none(`SELECT set_config('app.current_workspace_id', $1, true)`, [workspaceId]);

    // Verify membership inside the transaction (defense in depth)
    const membership = await tx.oneOrNone<{ role: string }>(
      `SELECT role FROM workspace_memberships
       WHERE user_id = $1 AND workspace_id = $2 AND removed_at IS NULL`,
      [userId, workspaceId],
    );
    if (!membership) {
      throw new AppError('WORKSPACE_NOT_FOUND', 'User is not a member of this workspace.');
    }

    return callback(tx);
  });
}
