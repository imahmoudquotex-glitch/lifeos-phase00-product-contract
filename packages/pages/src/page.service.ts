import { type DbClient } from '@lifeos/db';

export const pageService = {
  createPage: async (db: DbClient, params: { workspaceId: string, title: string, parentId?: string | null }) => {
    return db.one(
      `INSERT INTO pages (workspace_id, title, parent_id) VALUES ($1, $2, $3) RETURNING id`,
      [params.workspaceId, params.title, params.parentId || null]
    );
  },
  findById: async (db: DbClient, pageId: string, workspaceId: string) => {
    return db.oneOrNone(
      `SELECT * FROM pages WHERE id = $1 AND workspace_id = $2 AND archived_at IS NULL`,
      [pageId, workspaceId]
    );
  },
  update: async (db: DbClient, pageId: string, workspaceId: string, updates: { title?: string, content?: string }) => {
    // Basic implementation for MVP
    return db.one(
      `UPDATE pages SET title = COALESCE($1, title), content = COALESCE($2, content), updated_at = now() 
       WHERE id = $3 AND workspace_id = $4 RETURNING *`,
      [updates.title, updates.content, pageId, workspaceId]
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
    return db.any(
      `SELECT id, parent_id, title FROM pages WHERE workspace_id = $1 AND archived_at IS NULL ORDER BY created_at ASC`,
      [workspaceId]
    );
  }
};
