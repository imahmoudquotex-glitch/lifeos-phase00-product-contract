# ADR 0014 — BaseRepo: No SELECT *

## Status
Accepted

## Context
`SELECT *` breaks when columns are added or reordered, and prevents column-level reasoning about data access. It can also accidentally expose sensitive columns added later.

## Decision
- `BaseRepo<TEntity, TRow>` abstract class requires subclasses to declare `readonly columns: readonly string[]`
- `selectList()` method joins the explicit column list — prevents wildcards at runtime
- Runtime guard: if `columns` includes `'*'`, an error is thrown at construction time
- CI guard `check-no-sql-in-routes.ts` also prevents raw SQL in route handlers

```typescript
// Enforced pattern:
protected readonly columns = ['id', 'workspace_id', 'title', 'created_at'] as const;

// Produces: SELECT id, workspace_id, title, created_at FROM tasks WHERE ...
// Never: SELECT * FROM tasks WHERE ...
```

## Consequences
- ✅ Explicit column selection in all queries
- ✅ New columns don't automatically appear in API responses
- ✅ CI-enforced via `repos-no-select-star.test.ts`
- ❌ Slightly more verbose repo implementations (mitigated by typed arrays)
