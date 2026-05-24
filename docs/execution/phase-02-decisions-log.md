# Phase 02 — Decisions Log

## D-020 — Branch + tag naming follows unified convention
Branch: `phase/02-kernel`. Tag: `phase-02-locked`. Per global-conventions §19.

## D-021 — Server-side sessions (not JWT)
Reason: trivial revocation, no token-in-localStorage, IP/UA capture for audit.
ADR: 0005.

## D-022 — RLS context via session GUCs
Reason: single enforcement point at the DB; impossible to bypass from any code path that uses the standard DbClient.
ADR: 0006.

## D-023 — Page depth ≤ 50 + recompute on subtree move
Reason: UI sanity + prevent pathological trees. Recompute runs inside the same tx as the move.
ADR: 0007.

## D-024 — Generic invitation error
Reason: prevent email/workspace enumeration.
ADR: 0008.

## D-025 — uq_workspace_owner_marker enforces exactly-one owner
Reason: DB-level guarantee "no workspace without owner".

## D-026 — bcrypt cost 12 minimum
Reason: 2026 baseline; revisit when hardware changes.

## D-027 — Password hash nullable
Reason: OAuth-only users will not have one (Phase 04).

## D-028 — transferOwnership atomicity (no DEFERRABLE partial index)
Reason: PostgreSQL does not support DEFERRABLE on partial unique indexes. Application layer enforces transition order inside one tx: (1) revoke old owner via UPDATE removed_at, (2) promote new owner via UPDATE role or INSERT, (3) audit, (4) rotateOnPrivilegeChange for both users.
ADR: 0009.

## D-029 — ServerEnv extended in Phase 02 (no fork)
Reason: SESSION_PEPPER, SESSION_TTL_DAYS, SESSION_COOKIE_NAME, MAGIC_LINK_TTL_MINUTES, PASSWORD_RESET_TTL_MINUTES, EMAIL_VERIFICATION_TTL_HOURS, APP_URL are added to the existing getServerEnv() schema in @lifeos/shared/server-env.

## D-030 — assertNoCycle uses recursive CTE (single round-trip)
Reason: Recursive CTE collapses to one query bounded by MAX_DEPTH + 1, avoiding N+1 round-trips per move.

## D-031 — last_seen_at write throttled to 5 minutes
Reason: Avoid per-request UPDATE pressure. 5-minute granularity is acceptable for audit/UX. No need to defer to Phase 06.

## D-032 — withWorkspaceRoute implementation finalized in Phase 02
Reason: Phase 02 wires the route adapter to validateSession + membership resolution + role injection + withWorkspaceContext.

## D-033 — invitationGenericError as a function (not singleton)
Reason: A shared AppError instance leaks request-scoped state (stack, metadata). Factory function returns a fresh instance per call.

## D-034 — pgTAP fixtures use SET LOCAL row_security = off
Reason: FORCE RLS applies to table owners too. Test role has BYPASSRLS for fixture insertion; row_security is re-enabled before assertions.
