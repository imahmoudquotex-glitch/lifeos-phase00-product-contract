# ADR 0007 — Page Tree Depth Strategy

- Status: Accepted
- Date: 2026-01-12
- Owner: platform team
- Supersedes: —

## Context

Pages in a workspace are organized as a tree (each page has an optional `parent_id`). Two failure modes must be prevented:

1. **Cycles** — a page is moved under one of its own descendants, creating an infinite loop in any tree traversal query.
2. **Unbounded depth** — a legitimate tree of 5,000+ levels causes O(N) CTE traversal and pathological UI rendering.

The migration `0112__pages_tree_triggers.sql` adds a `depth` column to `pages`. Tree integrity must be maintained on every INSERT and MOVE operation.

## Decision

**Cycle prevention**: before accepting a MOVE (`parent_id` change), run `assertNoCycle(client, workspaceId, pageId, newParentId)` which executes a single recursive CTE:

```sql
WITH RECURSIVE ancestors AS (
  SELECT id, parent_id FROM pages WHERE id = $newParentId
  UNION ALL
  SELECT p.id, p.parent_id FROM pages p
  INNER JOIN ancestors a ON a.parent_id = p.id
)
SELECT id FROM ancestors WHERE id = $pageId LIMIT 1
```

If `$pageId` appears in the ancestor chain of `$newParentId`, the move is rejected with `PAGE_INVALID_MOVE`.

**Depth enforcement**: maximum depth is **50 levels**. After every accepted MOVE, `recomputeSubtreeDepth` runs a single CTE UPDATE inside the same transaction to refresh `depth` for the entire moved subtree. The application layer checks the new root's depth does not exceed 50 after recomputation.

## Alternatives Considered

- **PostgreSQL trigger for cycle check** — rejected because trigger-level recursive CTEs cannot easily surface application-level error codes (the trigger would raise an exception with a raw Postgres error, not an `AppError`).
- **N+1 parent walk in application code** — rejected because each step is a DB round-trip. For a tree of depth D, that's D queries per move. The recursive CTE collapses to one query regardless of depth.
- **No depth limit** — rejected because deeply nested trees (>100 levels) cause visible UI lag (accordion rendering) and recursive CTE queries approach statement_timeout risk.
- **Depth limit via trigger** — viable, but adds silent failure risk (the trigger fires after insert, so depth could be exceeded momentarily). Application-layer check before insert is safer and gives a clean error code.

## Consequences

- **Positive**: cycle detection is O(1) in number of round-trips (single CTE query).
- **Positive**: depth recomputation is O(N) in subtree size — acceptable for trees ≤ 5,000 nodes. For a 500-node subtree, recompute finishes in < 5ms on a typical Postgres instance.
- **Negative**: `recomputeSubtreeDepth` holds a table lock on the affected rows for the duration of the move transaction. Concurrent writes to the same subtree are blocked for ~1–10ms in normal cases.
- **Negative**: If the tree grows beyond 5,000 nodes, subtree recomputation may exceed 200ms. Profiling gate set at that threshold — optimize in Phase 06 if hit.
- **CI enforcement**: `tree-cycle.test.ts` and `recompute-depth.test.ts` cover the CTE logic and depth limit.

## Links

- Related code: `packages/pages/src/tree.ts` (`assertNoCycle`, `recomputeSubtreeDepth`)
- Related migrations: `0111__pages.sql`, `0112__pages_tree_triggers.sql`, `0117__rls_policies_pages.sql`
- ADR 0006 (RLS context): tree operations run inside `withWorkspaceContext`.
