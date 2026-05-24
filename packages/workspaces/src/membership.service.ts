import { type DbClient } from '@lifeos/db';
import { AppError } from '@lifeos/shared/errors';

export const membershipService = {
  assertNotLastOwner: async (db: DbClient, workspaceId: string, userId: string) => {
    const mem = await db.oneOrNone<{ role: string }>(
      `SELECT role FROM workspace_memberships WHERE workspace_id = $1 AND user_id = $2 AND removed_at IS NULL`,
      [workspaceId, userId]
    );
    if (mem?.role === 'owner') {
      const ownersCount = await db.one<{ count: string }>(
        `SELECT COUNT(*) as count FROM workspace_memberships WHERE workspace_id = $1 AND role = 'owner' AND removed_at IS NULL`,
        [workspaceId]
      );
      if (parseInt(ownersCount.count, 10) <= 1) {
        throw new AppError('VALIDATION_FAILED', 'Cannot remove or demote the last owner');
      }
    }
  },

  listMembers: async (db: DbClient, workspaceId: string) => {
    return db.many(
      `SELECT m.id, m.user_id, m.role, u.email, u.display_name
       FROM workspace_memberships m
       JOIN users u ON m.user_id = u.id
       WHERE m.workspace_id = $1 AND m.removed_at IS NULL`,
      [workspaceId]
    );
  },
  
  updateRole: async (db: DbClient, workspaceId: string, userId: string, role: string) => {
    if (role !== 'owner') {
      await membershipService.assertNotLastOwner(db, workspaceId, userId);
    }
    return db.one(
      `UPDATE workspace_memberships SET role = $1 WHERE workspace_id = $2 AND user_id = $3 AND removed_at IS NULL RETURNING *`,
      [role, workspaceId, userId]
    );
  },
  
  removeMember: async (db: DbClient, workspaceId: string, userId: string) => {
    await membershipService.assertNotLastOwner(db, workspaceId, userId);
    await db.none(
      `UPDATE workspace_memberships SET removed_at = now() WHERE workspace_id = $1 AND user_id = $2 AND removed_at IS NULL`,
      [workspaceId, userId]
    );
    return true;
  }
};
