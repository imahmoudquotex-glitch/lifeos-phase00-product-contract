
import { db } from '@lifeos/db';

export const membershipService = {
  listMembers: async (tx: any, workspaceId: string) => {
    return tx.any(
      `SELECT m.id, m.user_id, m.role, u.email, u.display_name
       FROM workspace_memberships m
       JOIN users u ON m.user_id = u.id
       WHERE m.workspace_id = $1 AND m.removed_at IS NULL`,
      [workspaceId]
    );
  },
  removeMember: async (tx: any, workspaceId: string, userId: string) => {
    await tx.none(
      `UPDATE workspace_memberships SET removed_at = now() WHERE workspace_id = $1 AND user_id = $2`,
      [workspaceId, userId]
    );
  }
};
