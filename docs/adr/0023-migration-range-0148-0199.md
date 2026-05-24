# ADR-0023 — Migration Range 0148..0199 for Phase 04

**Status:** Accepted
**Phase:** 04
**Date:** 2026-05-24

## Decision

Maintain a continuous, sequential migration numbering scheme across all phases.

## Reserved Ranges

| Range | Phase | Status |
|---|---|---|
| 0001..0099 | Phase 02 baseline | Applied |
| 0100..0118 | Phase 02 | Applied |
| 0119..0147 | Phase 03 | Applied |
| **0148..0199** | **Phase 04** | **This phase** |
| 0200..0299 | Phase 05 | Reserved |
| 0300+ | Unassigned | Not yet planned |

## Rationale

- Makes ordering unambiguous (no gaps, no jumps).
- Allows `scripts/migrate.ts` to validate continuity automatically.
- Prevents the `0300+` namespace from being used prematurely.

## Enforcement

- `scripts/check-migrations.ts` (CI gate) validates that no migration number is skipped.
- Convention violation (`wave/*` branches, `wNN-frozen` tags, migrations `0300+`) is rejected at code review.
