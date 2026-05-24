import { type DbClient } from '@lifeos/db';

export const invitationService = {
  create: async (db: DbClient, workspaceId: string, email: string, role: string) => {
    return db.one(
      `INSERT INTO workspace_invitations (workspace_id, email, role, token, expires_at)
       VALUES ($1, $2, $3, encode(gen_random_bytes(32), 'hex'), now() + interval '7 days')
       RETURNING *`,
      [workspaceId, email, role]
    );
  },
  listByWorkspace: async (db: DbClient, workspaceId: string) => {
    return db.any(
      `SELECT * FROM workspace_invitations WHERE workspace_id = $1 AND status = 'pending'`,
      [workspaceId]
    );
  },
  findByToken: async (db: DbClient, token: string) => {
    return db.oneOrNone(
      `SELECT wi.id, wi.workspace_id, wi.role, wi.expires_at, w.name as workspace_name
       FROM workspace_invitations wi
       JOIN workspaces w ON wi.workspace_id = w.id
       WHERE wi.token = $1 AND wi.status = 'pending'`,
      [token]
    );
  },
  accept: async (db: DbClient, userId: string, token: string) => {
    return db.tx(async (tx) => {
      const inv = await tx.one(
        `UPDATE workspace_invitations SET status = 'accepted' WHERE token = $1 AND status = 'pending' RETURNING workspace_id, role`,
        [token]
      );
      return tx.one(
        `INSERT INTO workspace_memberships (workspace_id, user_id, role) VALUES ($1, $2, $3) RETURNING id`,
        [(inv as any).workspace_id, userId, (inv as any).role]
      );
    });
  },
  decline: async (db: DbClient, userId: string, token: string) => {
    await db.none(`UPDATE workspace_invitations SET status = 'declined' WHERE token = $1 AND status = 'pending'`, [token]);
    return true;
  }
};
