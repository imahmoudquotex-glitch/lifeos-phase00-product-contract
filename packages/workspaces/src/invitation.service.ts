import { type DbClient } from '@lifeos/db';
import { newUlid } from '@lifeos/shared/ids';
import { createHmac, createHash } from 'crypto';
import { getServerEnv } from '@lifeos/shared/env';

function hashInvitationToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export const invitationService = {
  create: async (db: DbClient, workspaceId: string, email: string, role: string, invitedBy: string) => {
    const rawToken = newUlid(); // or random bytes
    const tokenHash = hashInvitationToken(rawToken);
    
    await db.one(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token_hash, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, now() + interval '7 days')
       RETURNING *`,
      [newUlid(), workspaceId, email, role, tokenHash, invitedBy]
    );
    // Return rawToken to send via email
    return { token: rawToken };
  },
  
  listByWorkspace: async (db: DbClient, workspaceId: string) => {
    return db.many(
      `SELECT * FROM workspace_invitations 
       WHERE workspace_id = $1 
         AND accepted_at IS NULL 
         AND declined_at IS NULL 
         AND revoked_at IS NULL`,
      [workspaceId]
    );
  },
  
  findByToken: async (db: DbClient, rawToken: string) => {
    const tokenHash = hashInvitationToken(rawToken);
    return db.oneOrNone(
      `SELECT wi.id, wi.workspace_id, wi.role, wi.expires_at, w.name as workspace_name
       FROM workspace_invitations wi
       JOIN workspaces w ON wi.workspace_id = w.id
       WHERE wi.token_hash = $1 
         AND wi.accepted_at IS NULL 
         AND wi.declined_at IS NULL 
         AND wi.revoked_at IS NULL`,
      [tokenHash]
    );
  },
  
  accept: async (db: DbClient, userId: string, rawToken: string) => {
    const tokenHash = hashInvitationToken(rawToken);
    return db.tx(async (tx) => {
      const inv = await tx.one<{ workspace_id: string; role: string }>(
        `UPDATE workspace_invitations SET accepted_at = now() 
         WHERE token_hash = $1 
           AND accepted_at IS NULL 
           AND declined_at IS NULL 
           AND revoked_at IS NULL 
         RETURNING workspace_id, role`,
        [tokenHash]
      );
      return tx.one(
        `INSERT INTO workspace_memberships (id, workspace_id, user_id, role) VALUES ($1, $2, $3, $4) RETURNING id`,
        [newUlid(), inv.workspace_id, userId, inv.role]
      );
    });
  },
  
  decline: async (db: DbClient, userId: string, rawToken: string) => {
    const tokenHash = hashInvitationToken(rawToken);
    await db.none(
      `UPDATE workspace_invitations SET declined_at = now() 
       WHERE token_hash = $1 
         AND accepted_at IS NULL 
         AND declined_at IS NULL 
         AND revoked_at IS NULL`, 
      [tokenHash]
    );
    return true;
  }
};
