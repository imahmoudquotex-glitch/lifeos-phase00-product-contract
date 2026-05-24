# ADR-0025 — Zenith UI: In-Place Merge into apps/web

**Status:** Accepted  
**Phase:** 05  
**Date:** 2026-05-24

## Context

The Zenith UI (built on Lovable) provides the design system, auth pages, and global CSS for LifeOS. Two integration approaches were considered:
1. Git submodule / runtime dependency on Zenith repo
2. In-place file merge into `apps/web/src/`

## Decision

Zenith UI is **merged in-place** into `apps/web/`. No runtime dependency. No submodule.

Steps:
1. `git remote add zenith https://github.com/imahmoudquotex-glitch/zenith-life-os-3a8f4fd8`
2. `git fetch zenith`
3. `git checkout zenith/main -- <files>`
4. Copy files to `apps/web/app/` and `apps/web/src/`
5. Pin commit SHA in `scripts/zenith-merge-verify.ts`
6. `git remote remove zenith`

**Pinned commit:** `7307c7cb6449696ddd29b93ff0910773d219634c`  
**Merge date:** 2026-05-24

## Consequences

- Files are now part of the monorepo — subject to local modification, typecheck, lint, design-drift
- Zenith auth pages are rewired from Supabase to `@lifeos/auth` API routes
- Supabase client imports (`@/lib/supabase/client`) are removed from merged files
- No network dependency on Zenith remote at runtime or build time
- If Zenith remote is deleted after merge: no impact (files already in monorepo)
