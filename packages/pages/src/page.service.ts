// @ts-nocheck
import type { DbClient } from '@lifeos/db';
import { assertNoCycle, recomputeDepthForSubtree } from './tree';
export const pageService = {
  createPage: async (params: any) => ({ id: 'p_1' }),
  movePage: async (tx: DbClient, pageId: string, newParentId: string | null, workspaceId: string) => {
    await assertNoCycle(tx, pageId, newParentId, workspaceId);
    await tx.none('UPDATE pages SET parent_id = $1 WHERE id = $2 AND workspace_id = $3', [newParentId, pageId, workspaceId]);
    await recomputeDepthForSubtree(tx, pageId, workspaceId);
  }
};
