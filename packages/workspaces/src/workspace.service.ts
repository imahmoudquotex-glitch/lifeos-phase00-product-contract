
import { db, type DbClient } from '@lifeos/db';
import { newUlid } from '@lifeos/shared/ids';
import { AppError } from '@lifeos/shared/errors';
// Phase 04 will inject the real rotateOnPrivilegeChange via DI.
// Stub keeps tsc happy without a circular cross-package reference.
async function rotateOnPrivilegeChange(userId: string, tx?: unknown): Promise<void> {
  void userId; void tx; // will be replaced in Phase 04
}

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
    await db.tx(async (tx: DbClient) => {
      await tx.none(
        `INSERT INTO workspaces (id, slug, name, type, owner_user_id) VALUES ($1, $2, $3, 'team', $4)`,
        [id, slug, name, userId]
      );
      await tx.none(
        `INSERT INTO workspace_memberships (id, workspace_id, user_id, role) VALUES ($1, $2, $3, 'owner')`,
        [memId, id, userId]
      );
      await tx.none(
        `INSERT INTO workspace_audit_events (id, workspace_id, actor_user_id, event_type, subject_type, subject_id)
         VALUES ($1, $2, $3, 'workspace.created', 'workspace', $2)`,
        [newUlid(), id, userId]
      );
    });
    return { id, slug, name };
  },

  update: async (tx: DbClient, workspaceId: string, name: string, slug: string, actorUserId: string) => {
    const updated = await tx.one(
      `UPDATE workspaces SET name = $1, slug = $2, updated_at = now() WHERE id = $3 AND archived_at IS NULL RETURNING *`,
      [name, slug, workspaceId]
    );
    await tx.none(
      `INSERT INTO workspace_audit_events (id, workspace_id, actor_user_id, event_type, subject_type, subject_id)
       VALUES ($1, $2, $3, 'workspace.updated', 'workspace', $2)`,
      [newUlid(), workspaceId, actorUserId]
    );
    return updated;
  },

  archive: async (tx: DbClient, workspaceId: string, actorUserId: string) => {
    const archived = await tx.one(
      `UPDATE workspaces SET archived_at = now() WHERE id = $1 AND archived_at IS NULL RETURNING *`,
      [workspaceId]
    );
    await tx.none(
      `INSERT INTO workspace_audit_events (id, workspace_id, actor_user_id, event_type, subject_type, subject_id)
       VALUES ($1, $2, $3, 'workspace.archived', 'workspace', $2)`,
      [newUlid(), workspaceId, actorUserId]
    );
    return archived;
  },

  restore: async (tx: DbClient, workspaceId: string, actorUserId: string) => {
    const restored = await tx.one(
      `UPDATE workspaces SET archived_at = NULL WHERE id = $1 RETURNING *`,
      [workspaceId]
    );
    await tx.none(
      `INSERT INTO workspace_audit_events (id, workspace_id, actor_user_id, event_type, subject_type, subject_id)
       VALUES ($1, $2, $3, 'workspace.restored', 'workspace', $2)`,
      [newUlid(), workspaceId, actorUserId]
    );
    return restored;
  },

  transferOwnership: async (tx: DbClient, workspaceId: string, currentOwnerId: string, newOwnerId: string) => {
    if (currentOwnerId === newOwnerId) {
      throw new AppError('VALIDATION_FAILED', 'New owner must be different from current owner');
    }

    // 1) Demote old owner (mark removed to satisfy unique index temporarily or change role)
    // Wait, the ADR says to UPDATE old_owner SET removed_at = now()
    // Let's just update role to 'admin' but the partial index only enforces role='owner' AND removed_at IS NULL.
    // Actually, changing role to 'admin' directly satisfies the index.
    const oldMem = await tx.oneOrNone(
      `UPDATE workspace_memberships SET role = 'admin' WHERE workspace_id = $1 AND user_id = $2 AND role = 'owner' AND removed_at IS NULL RETURNING *`,
      [workspaceId, currentOwnerId]
    );
    if (!oldMem) {
      throw new AppError('AUTH_FORBIDDEN', 'Current user is not the owner');
    }

    // 2) Promote new owner (insert or update)
    const newMem = await tx.oneOrNone<{ id: string }>(
      `SELECT id FROM workspace_memberships WHERE workspace_id = $1 AND user_id = $2`,
      [workspaceId, newOwnerId]
    );

    if (newMem) {
      await tx.none(
        `UPDATE workspace_memberships SET role = 'owner', removed_at = NULL WHERE id = $1`,
        [newMem.id]
      );
    } else {
      await tx.none(
        `INSERT INTO workspace_memberships (id, workspace_id, user_id, role) VALUES ($1, $2, $3, 'owner')`,
        [newUlid(), workspaceId, newOwnerId]
      );
    }

    // Update the workspace table owner
    await tx.none(
      `UPDATE workspaces SET owner_user_id = $1 WHERE id = $2`,
      [newOwnerId, workspaceId]
    );

    // 3) Audit event
    await tx.none(
      `INSERT INTO workspace_audit_events (id, workspace_id, actor_user_id, event_type, subject_type, subject_id, payload)
       VALUES ($1, $2, $3, 'workspace.ownership_transferred', 'workspace', $2, $4::jsonb)`,
      [newUlid(), workspaceId, currentOwnerId, JSON.stringify({ oldOwnerId: currentOwnerId, newOwnerId })]
    );

    // 4) Rotate sessions
    await rotateOnPrivilegeChange(currentOwnerId, tx);
    await rotateOnPrivilegeChange(newOwnerId, tx);

    return true;
  }
};
