# ADR-0024 — Unified Phase Branch/Tag Convention (Final Lockdown)

**Status:** Accepted  
**Phase:** 05  
**Date:** 2026-05-24

## Context

Three previous phases used inconsistent branch/tag naming:
- `wave/*` branches (Phase 00/01) ← forbidden going forward  
- `wNN-frozen` tags ← forbidden going forward  
- Inconsistency caused confusion in CI and tooling

## Decision

Branch naming: `phase/NN-short-name` (e.g. `phase/05-zenith-ui-auth`)  
Tag naming: `phase-NN-locked` (annotated, e.g. `phase-05-locked`)  

`wave/*` and `wNN-frozen` are **forbidden** and enforced via:
1. `.husky/pre-push` hook (immediate dev feedback)
2. `.github/workflows/phase-convention.yml` (CI gate)

## Consequences

- All future phases MUST use `phase/NN-*` + `phase-NN-locked`
- CI will block pushes of non-compliant branch/tag names
- Historical `wave/*` branches are preserved read-only for reference only

## Pre-push hook

```bash
#!/usr/bin/env sh
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if echo "$BRANCH" | grep -qE '^wave/'; then
  echo "ERROR: 'wave/*' branches are forbidden. Use 'phase/NN-name'. (ADR-0024)"
  exit 1
fi
```
