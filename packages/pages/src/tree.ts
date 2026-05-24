import { AppError } from '@lifeos/shared/errors';
import type { DbClient } from '@lifeos/db';

/**
 * Validates that setting newParentId for pageId will not create a cycle.
 * Called internally within a withWorkspaceContext transaction.
 *
 * Uses a single recursive CTE — no N+1 round-trips.
 */
export async function assertNoCycle(
  client: DbClient,
  workspaceId: string,
  pageId: string,
  newParentId: string,
): Promise<void> {
  if (pageId === newParentId) {
    throw new AppError('VALIDATION_FAILED', 'Page cannot be its own parent');
  }

  // Use recursive CTE to find all ancestors of newParentId.
  // If pageId appears in those ancestors, the move would create a cycle.
  const rows = await client.many<{ id: string }>(
    `WITH RECURSIVE ancestors AS (
       SELECT id, parent_id FROM pages WHERE id = $2 AND workspace_id = $1
       UNION ALL
       SELECT p.id, p.parent_id FROM pages p
       INNER JOIN ancestors a ON a.parent_id = p.id
       WHERE p.workspace_id = $1
     )
     SELECT id FROM ancestors WHERE id = $3 LIMIT 1`,
    [workspaceId, newParentId, pageId],
  );

  if (rows.length > 0) {
    throw new AppError(
      'PAGE_INVALID_MOVE',
      'Cannot move a page under its own descendant (cycle detected)',
    );
  }
}

/**
 * Recomputes depth for a whole subtree after a move.
 * Must run within withWorkspaceContext.
 *
 * Single CTE UPDATE — O(N) in subtree size, no N+1.
 */
export async function recomputeSubtreeDepth(
  client: DbClient,
  workspaceId: string,
  rootPageId: string,
): Promise<void> {
  await client.none(
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
    [workspaceId, rootPageId],
  );
}
