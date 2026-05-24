# ADR 0012 — Note Version: Optimistic Concurrency

## Status
Accepted

## Context
Notes can be edited by multiple workspace members simultaneously. We need conflict detection without holding locks for the duration of user editing sessions.

## Decision
- `notes.version INTEGER NOT NULL DEFAULT 1`, incremented on every `UPDATE`
- `NoteRepo.updateWithVersion(id, workspaceId, expectedVersion, patch)` — `WHERE version = expectedVersion`
- If the `UPDATE` affects 0 rows: check if note still exists
  - Exists → return `'CONFLICT'` sentinel (throw `NOTE_VERSION_CONFLICT` in service layer)
  - Not exists → throw `NOTE_NOT_FOUND`
- Successful update appends a row to `note_versions` (append-only history, no soft-delete)

## Pattern
```
client sends: { noteId, expectedVersion: 3, patch: { title: '...' } }
DB UPDATE notes SET version = 4 WHERE id = $1 AND version = 3
-- 0 rows affected? → CONFLICT
-- 1 row affected? → success, insert note_versions row
```

## Consequences
- ✅ Detects concurrent edits without pessimistic locks
- ✅ Full edit history in `note_versions` (immutable, append-only)
- ✅ No long-held DB locks
- ❌ Clients must send `expectedVersion` on every update request
- ❌ Last-write-wins is not supported; clients must resolve conflicts explicitly
