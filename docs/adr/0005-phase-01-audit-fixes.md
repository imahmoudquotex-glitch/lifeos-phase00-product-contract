# ADR 0005: Revoke and Supersede Phase 01 Tag

## Context
A deep audit of Phase 01 revealed 14 defects (3 HIGH, 5 MEDIUM, 6 LOW), including missing .gitignore entries for .tsbuildinfo, inaccurate CI guard checks (check-naming.ts and check-no-sql-in-routes.ts), Node.js specific Buffer usage in shared packages, and minor documentation deviations.

According to docs/runbooks/rollback.md §8, the phase-01-locked tag cannot be deleted. Any changes to Phase 01 that require a new baseline must leave the old tag in place, tag it as revoked, and create a superseding tag.

## Decision
1. We apply the fixes for all 14 defects on the phase/01-architecture branch.
2. We tag the old commit (21b7e567d9f3b04003f305818cdf90cf90480080) as phase-01-locked-revoked.
3. We tag the new HEAD as phase-01-locked-v1.1.
4. We push these tags to origin.

## Consequences
- The original flawed state remains accessible but explicitly marked as revoked.
- Subsequent phases will rebase onto the new phase-01-locked-v1.1 or directly incorporate these fixes.
- Browser/Edge compatibility is secured by removing Buffer.
- CI noise from .tsbuildinfo is eliminated.
