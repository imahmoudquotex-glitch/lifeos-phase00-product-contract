import { type DbClient } from '@lifeos/db';

export const pageService = {
  createPage: async (db: DbClient, params: { workspaceId: string; title: string; parentId?: string | null; createdBy?: string }) => {
    return db.one(
      `INSERT INTO pages (workspace_id, title, parent_id, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, workspace_id, title, parent_id, created_by, created_at`,
      [params.workspaceId, params.title, params.parentId ?? null, params.createdBy ?? null]
    );
  },
  findById: async (db: DbClient, pageId: string, workspaceId: string) => {
    return db.oneOrNone(
      `SELECT * FROM pages WHERE id = $1 AND workspace_id = $2 AND archived_at IS NULL`,
      [pageId, workspaceId]
    );
  },
  update: async (db: DbClient, pageId: string, workspaceId: string, updates: { title?: string }) => {
    return db.one(
      `UPDATE pages SET title = COALESCE($1, title), updated_at = now() 
       WHERE id = $2 AND workspace_id = $3 RETURNING *`,
      [updates.title, pageId, workspaceId]
    );
  },
  movePage: async (db: DbClient, pageId: string, newParentId: string | null, workspaceId: string) => {
    return db.one(
      `UPDATE pages SET parent_id = $1, updated_at = now() WHERE id = $2 AND workspace_id = $3 RETURNING *`,
      [newParentId, pageId, workspaceId]
    );
  },
  archive: async (db: DbClient, pageId: string, workspaceId: string) => {
    return db.one(
      `UPDATE pages SET archived_at = now() WHERE id = $1 AND workspace_id = $2 RETURNING *`,
      [pageId, workspaceId]
    );
  },
  getTree: async (db: DbClient, workspaceId: string) => {
    // Use many() — any() was removed from DbClient in Phase 01 contract fix
    return db.many(
      `SELECT id, parent_id, title, created_at FROM pages
       WHERE workspace_id = $1 AND archived_at IS NULL
       ORDER BY created_at ASC`,
      [workspaceId]
    );
  }
};
