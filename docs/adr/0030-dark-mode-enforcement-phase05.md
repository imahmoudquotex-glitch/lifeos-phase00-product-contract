# ADR-0030 — Dark-Mode-Only Design System Enforcement (Phase 05 Gate)

**Status:** Accepted  
**Phase:** 05  
**Date:** 2026-05-24

## Context

ADR-0010 (Phase 02) declared dark-mode-only UI. The `design-drift` CI gate detects light-mode Tailwind classes (e.g., `bg-white`, `text-black`, `bg-gray-100`). Phase 05 extends this gate to all new packages.

## Decision

The `design-drift` gate is extended to cover:
- `packages/auth-ui/src/**`
- `packages/web-guards/src/**`
- `apps/web/app/(auth)/**`
- `apps/web/app/(settings)/**`

**Forbidden class patterns:**
- `bg-white`, `bg-gray-*`, `bg-slate-*` (without `dark:` prefix)
- `text-black`, `text-gray-*` (without `dark:` prefix)
- Any inline `style={{ background: 'white' }}` or `style={{ color: 'black' }}`

**Allowed approach:**
- CSS custom properties: `var(--bg-base)`, `var(--text-primary)`, `var(--accent-purple)`
- Tailwind with explicit `dark:` prefix
- Inline styles using CSS variables only

## Consequences

- `PasswordStrength` uses inline `style={{ background: 'var(--bg-elevated)' }}` to avoid tailwind class drift ✓
- `LocaleSwitcher` uses `var(--accent-purple)`, `var(--bg-elevated)` ✓
- Design tokens defined in `apps/web/app/globals.css` (from Zenith merge)
- Gate runs in CI on every PR targeting `main` and `phase/*`
