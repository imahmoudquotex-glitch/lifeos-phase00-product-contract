import { type DbClient } from '@lifeos/db';

export const membershipService = {
  listMembers: async (db: DbClient, workspaceId: string) => {
    return db.any(
      `SELECT m.id, m.user_id, m.role, u.email, u.display_name
       FROM workspace_memberships m
       JOIN users u ON m.user_id = u.id
       WHERE m.workspace_id = $1 AND m.removed_at IS NULL`,
      [workspaceId]
    );
  },
  updateRole: async (db: DbClient, workspaceId: string, userId: string, role: string) => {
    return db.one(
      `UPDATE workspace_memberships SET role = $1 WHERE workspace_id = $2 AND user_id = $3 AND removed_at IS NULL RETURNING *`,
      [role, workspaceId, userId]
    );
  },
  removeMember: async (db: DbClient, workspaceId: string, userId: string) => {
    await db.none(
      `UPDATE workspace_memberships SET removed_at = now() WHERE workspace_id = $1 AND user_id = $2 AND removed_at IS NULL`,
      [workspaceId, userId]
    );
    return true;
  }
};
