# 0007: Page Tree Depth Strategy

## Context
Pages are organized in a tree hierarchy per workspace. Deeply nested trees can cause UI issues and pathological DB queries.

## Decision
We enforce a maximum depth of 50. Depth is automatically recomputed on subtree moves inside the same transaction using a recursive CTE.
