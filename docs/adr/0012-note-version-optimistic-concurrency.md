# ADR 0012 — Note Version-Based Optimistic Concurrency

- Status: Accepted
- Date: 2026-02-01
- Owner: platform team
- Supersedes: —

## Context

Notes can be edited by multiple workspace members concurrently (e.g., two users have the same note open on different devices). Two patterns handle concurrent writes:

1. **Pessimistic locking** (`SELECT FOR UPDATE`): blocks all readers/writers while one writer holds the lock. Prevents conflicts but serializes access.
2. **Optimistic concurrency control (OCC)**: allows concurrent reads and writes; detects conflicts at write time using a version or timestamp.

For a collaborative note editor, OCC is preferred because:
- Conflicts are rare in practice (most users edit different sections or at different times).
- Blocking all readers while one person types is a poor UX.
- The conflict resolution UI (merge / override) is more user-friendly than a spinner during a lock.

## Decision

The `notes` table has a `version INTEGER NOT NULL DEFAULT 0` column. The only mutation path is `updateWithVersion(id, version, patch)` which executes:

```sql
UPDATE notes
SET body = $newBody, title = $newTitle, version = version + 1, updated_at = now()
WHERE id = $id AND workspace_id = $workspaceId AND version = $expectedVersion
RETURNING *
```

The return value is a discriminated union:
- **`Note`** — the update succeeded; the returned row has `version = expectedVersion + 1`.
- **`'CONFLICT'`** — the UPDATE matched 0 rows because `version` has advanced (another write occurred). Client must re-fetch the note, present the diff, and retry.
- **`null`** — note does not exist or is archived. Client should handle as "not found".

The `RETURNING *` + row count check disambiguates the three cases:
- 1 row returned → `Note`.
- 0 rows returned + note exists → `'CONFLICT'`.
- 0 rows returned + note absent → `null`.

## Alternatives Considered

- **`SELECT FOR UPDATE` on the note row** — rejected because it blocks concurrent readers during write processing (server-sent events, presence subscriptions) and creates latency spikes under multiple simultaneous editors.
- **Last-write-wins (no version check)** — rejected because it silently discards edits. In a collaborative app, silent data loss is unacceptable.
- **CRDTs** — rejected for Phase 03. Correct but complex; deferred to Phase 07 if real-time collaboration becomes a primary feature.
- **Event sourcing (append-only)** — rejected for Phase 03. Notes have a `notes_versions` table for snapshots, but full event sourcing adds query complexity not justified at this scale.

## Consequences

- **Positive**: concurrent reads are not blocked — only the write transaction needs to succeed.
- **Positive**: the conflict detection is a single atomic SQL statement (no separate SELECT needed).
- **Negative**: clients must implement conflict resolution UI (show diff, let user choose). This is frontend complexity deferred to Phase 05 (UI polish).
- **Negative**: version column adds 4 bytes per note row. Trivial at scale.
- **CI enforcement**: `note.repo.test.ts` verifies: (1) successful update increments version, (2) stale-version update returns `'CONFLICT'`, (3) nonexistent note returns `null`.

## Links

- Related migration: `0123__notes.sql` (version column), `0124__notes_versions.sql` (snapshot history)
- Related code: `packages/services/src/notes/note.repo.ts` (`updateWithVersion`)
- ADR 0013 (vault crypto): similar metadata-first, crypto-later pattern used in vault.
