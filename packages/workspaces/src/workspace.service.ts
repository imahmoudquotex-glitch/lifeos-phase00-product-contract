
import { db } from '@lifeos/db';
import { newUlid } from '@lifeos/shared/ids';

export const workspaceService = {
  listUserWorkspaces: async (userId: string) => {
    return db.many(
      `SELECT w.id, w.slug, w.name, wm.role
       FROM workspaces w
       JOIN workspace_memberships wm ON w.id = wm.workspace_id
       WHERE wm.user_id = $1 AND wm.removed_at IS NULL AND w.archived_at IS NULL`,
      [userId]
    );
  },
  createWorkspace: async (userId: string, name: string, slug: string) => {
    const id = newUlid();
    const memId = newUlid();
    await db.tx(async (tx: any) => {
      await tx.none(
        `INSERT INTO workspaces (id, slug, name, type, owner_user_id) VALUES ($1, $2, $3, 'team', $4)`,
        [id, slug, name, userId]
      );
      await tx.none(
        `INSERT INTO workspace_memberships (id, workspace_id, user_id, role) VALUES ($1, $2, $3, 'owner')`,
        [memId, id, userId]
      );
    });
    return { id, slug, name };
  }
};
