// @ts-nocheck
import { AppError } from '@lifeos/shared/errors';

/**
 * Validates that setting newParentId for pageId will not create a cycle.
 * Called internally within a withWorkspaceContext transaction.
 */
export async function assertNoCycle(
  client: any,
  workspaceId: string,
  pageId: string,
  newParentId: string
): Promise<void> {
  if (pageId === newParentId) {
    throw new AppError('VALIDATION_FAILED', 'Page cannot be its own parent');
  }
  
  // Use recursive CTE to find all ancestors of newParentId
  const result = await client.query(
    `WITH RECURSIVE ancestors AS (
       SELECT id, parent_id FROM pages WHERE id = $2 AND workspace_id = $1
       UNION ALL
       SELECT p.id, p.parent_id FROM pages p
       INNER JOIN ancestors a ON a.parent_id = p.id
       WHERE p.workspace_id = $1
     )
     SELECT id FROM ancestors WHERE id = $3 LIMIT 1`,
    [workspaceId, newParentId, pageId]
  );
  
  if (result.rows.length > 0) {
    throw new AppError('VALIDATION_FAILED', 'Cannot move a page under its own descendant (cycle detected)');
  }
}

/**
 * Recomputes depth for a whole subtree after a move.
 * Must run within withWorkspaceContext.
 */
export async function recomputeSubtreeDepth(
  client: any,
  workspaceId: string,
  rootPageId: string
): Promise<void> {
  await client.query(
    `WITH RECURSIVE subtree AS (
       SELECT id, depth FROM pages WHERE id = $2 AND workspace_id = $1
       UNION ALL
       SELECT p.id, s.depth + 1
       FROM pages p
       INNER JOIN subtree s ON p.parent_id = s.id
       WHERE p.workspace_id = $1
     )
     UPDATE pages p
     SET depth = s.depth
     FROM subtree s
     WHERE p.id = s.id AND p.workspace_id = $1`,
    [workspaceId, rootPageId]
  );
}
