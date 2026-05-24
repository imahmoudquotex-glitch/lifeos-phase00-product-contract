# ADR 0009 — Transfer Ownership Atomicity

- Status: Accepted
- Date: 2026-01-12
- Owner: platform team
- Supersedes: —

## Context

A workspace must have exactly one owner at all times. Migration `0107__workspace_memberships.sql` enforces this with a partial unique index:

```sql
CREATE UNIQUE INDEX uq_workspace_owner_marker
  ON workspace_members (workspace_id)
  WHERE role = 'owner' AND removed_at IS NULL;
```

Transferring ownership requires atomically swapping roles: the current owner loses `role = 'owner'` and the new owner gains it. Naively doing this as two sequential UPDATEs will transiently violate the unique index constraint — unless the constraint is deferrable.

**Problem**: PostgreSQL does not support `DEFERRABLE` on partial unique indexes (only on full unique constraints). A `DEFERRABLE INITIALLY DEFERRED` annotation on this index would require converting it to a `UNIQUE CONSTRAINT` without the `WHERE` clause, which would break the invariant for closed memberships (`removed_at IS NOT NULL`).

## Decision

Application layer enforces a specific transaction order that avoids ever having two active owners simultaneously:

1. **Revoke old owner**: `UPDATE workspace_members SET removed_at = NOW() WHERE workspace_id = $1 AND user_id = $oldOwner AND role = 'owner' AND removed_at IS NULL`. This row is now excluded from the partial index predicate.
2. **Promote new owner**: `UPDATE workspace_members SET role = 'owner' WHERE workspace_id = $1 AND user_id = $newOwner`. (If the new owner was a member, upgrade in place; if not a member, INSERT with role = 'owner'.)
3. **Audit log**: INSERT into `workspace_audit_events` with `event = 'ownership_transferred'`, old and new owner IDs.
4. **Rotate session privilege**: call `rotateOnPrivilegeChange(oldOwnerId)` and `rotateOnPrivilegeChange(newOwnerId)` — both flush any cached session role so the next request reflects the updated role.

All four steps run inside a single `db.tx()` call. If any step fails, the transaction rolls back to the original state.

## Alternatives Considered

- **DEFERRABLE INITIALLY DEFERRED on partial index** — rejected because PostgreSQL does not support deferred partial unique indexes. The constraint must be a full `UNIQUE CONSTRAINT`, which prevents the `WHERE removed_at IS NULL` predicate.
- **Application-level retry on unique violation** — rejected because a retry loop between the two UPDATEs creates a race window where a concurrent transfer could succeed between retries, producing two owners.
- **Trigger-based enforcement** — rejected because trigger execution order with two concurrent transactions is database-internal and cannot be reliably controlled from application code.
- **Soft-lock (advisory lock)** — viable as additional protection, but the ordered-UPDATE approach already prevents the constraint violation without a lock. Advisory locks add complexity without benefit here.

## Consequences

- **Positive**: the ordered UPDATE sequence guarantees the partial unique index is never violated — step 1 removes the old owner from the index predicate before step 2 inserts the new one.
- **Positive**: single transaction means the transfer is atomic — no partial state is ever visible to other requests.
- **Negative**: the new owner must already be a workspace member (or the INSERT step must also add them). Callers must validate this before calling `transferOwnership`.
- **Negative**: `rotateOnPrivilegeChange` adds 2 additional DB writes per transfer. Acceptable given transfers are rare operations.
- **CI enforcement**: `transfer-ownership-atomicity.test.ts` and `last-owner.test.ts` cover: successful transfer, rejection of last-owner transfer, and rollback-on-step-failure.

## Links

- Related code: `packages/workspaces/src/workspace.ts` (`transferOwnership`)
- Related migration: `0107__workspace_memberships.sql` (`uq_workspace_owner_marker`)
- ADR 0006 (RLS context): transfer runs inside `withWorkspaceContext` so RLS GUCs are set.
- ADR 0005 (session storage): `rotateOnPrivilegeChange` depends on session table structure.
