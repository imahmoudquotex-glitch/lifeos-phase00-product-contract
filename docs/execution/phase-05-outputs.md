# Phase 05 — Outputs Manifest

**Branch:** `phase/05-zenith-ui-auth`  
**Commit:** `8310f38` (pre-push: blocked by GitHub secret scanning on inherited secret — owner must allow via GitHub security UI)  
**Date:** 2026-05-24  
**Status:** ✅ Implementation complete — push pending owner unblock

---

## Delivered Artifacts

### New Packages (3)

| Package | Path | Key Export |
|---------|------|------------|
| `@lifeos/auth-ui` | `packages/auth-ui/` | SigninForm, SignupForm, ResetForm, PasswordStrength, Captcha, LocaleSwitcher |
| `@lifeos/email` | `packages/email/` | `renderEmail(name, locale, vars)` |
| `@lifeos/web-guards` | `packages/web-guards/` | `withCsrfProtection`, `withRateLimit`, `requireSession` |

### Auth Facades (ADR-0026)

| File | Purpose |
|------|---------|
| `packages/auth/src/sign-in-with-password.ts` | Composes verifyPassword + createSession + audit chain |
| `packages/auth/src/sign-up.ts` | User + workspace + membership in tx |
| `packages/auth/src/reset-password.ts` | Two-phase token reset (no user enumeration) |

### Zenith UI Integration (ADR-0025)

- Pinned commit: `7307c7cb6449696ddd29b93ff0910773d219634c`
- Supabase client: **fully removed** from all merged pages
- Font: Geist → **Inter** (available in next/font/google)
- Verified by: `scripts/zenith-merge-verify.ts`

### Auth Routes (5)

| Route | Method | Guards |
|-------|--------|--------|
| `/api/v1/auth/signin` | POST | CSRF + rate-limit (5/15min) |
| `/api/v1/auth/signup` | POST | CSRF + rate-limit (3/hr) |
| `/api/v1/auth/signout` | POST | CSRF |
| `/api/v1/auth/reset` | POST | CSRF + rate-limit (3/hr) |
| `/api/v1/auth/oauth/callback` | GET | State replay guard (D-077) |

### Pages

| Path | Auth | Purpose |
|------|------|---------|
| `app/(auth)/signin/page.tsx` | Public | Sign in |
| `app/(auth)/signup/page.tsx` | Public | Create account |
| `app/(auth)/reset/page.tsx` | Public | Password reset |
| `app/(settings)/security/page.tsx` | `requireSession` | Security settings |
| `app/(settings)/sessions/page.tsx` | `requireSession` | Active sessions |
| `app/(settings)/locale/page.tsx` | `requireSession` | Language preference |

### Infrastructure

| Item | Detail |
|------|--------|
| `middleware.ts` | Session validation + CSP nonce + security headers |
| `lib/get-session.ts` | Server Components session helper |
| `app/_hooks/use-session.ts` | Client-side session hook |

### Migrations (0200–0204)

| Migration | Change |
|-----------|--------|
| 0200 | `users.locale` column (ar\|en, default en) |
| 0201 | `rate_limit_buckets.bucket_kind` column |
| 0202 | `email_templates_registry` table + 8 seed rows |
| 0203 | `zenith_ui_preferences` (RLS, dark-only) |
| 0204 | Partial indexes on `workspace_audit_events` |

### ADRs (7, cumulative 21)

| ADR | Title |
|-----|-------|
| 0024 | Unified phase branch/tag convention |
| 0025 | Zenith UI in-place merge strategy |
| 0026 | `signInWithPassword` facade |
| 0027 | `withCsrfProtection` HOC |
| 0028 | Bi-lingual email (ICU + MJML) |
| 0029 | IP+email composite rate limit bucket |
| 0030 | Dark-mode enforcement Phase 05 |

### Error Codes (8 new, cumulative 38)

`AUTH_INVALID_CREDENTIALS`, `AUTH_RATE_LIMITED`, `AUTH_ACCOUNT_LOCKED`, `OAUTH_CALLBACK_FAILED`, `SESSION_REVOKED`, `LOCALE_NOT_SUPPORTED`, `CAPTCHA_REQUIRED`, `EMAIL_TEMPLATE_NOT_FOUND`

### Tests

| File | Count |
|------|-------|
| `packages/auth/src/__tests__/sign-in-with-password.test.ts` | 3 unit tests |
| `packages/auth/src/__tests__/sign-up.test.ts` | 2 unit tests |
| `packages/web-guards/src/__tests__/with-csrf-protection.test.ts` | 4 unit tests |
| `packages/email/src/__tests__/render.test.ts` | 5 unit tests |
| `packages/db/tests/pgtap/0200-0204-phase05.sql` | 12 pgTAP assertions |

### CI Gates

| Script | Purpose |
|--------|---------|
| `scripts/check-adr-coverage.ts` | Verifies 7 Phase 05 ADRs exist + accepted |
| `scripts/design-drift.ts` | Dark-mode enforcement (enhanced) |
| `scripts/zenith-merge-verify.ts` | Zenith commit SHA pin |

---

## Known Issues (post-Phase 05)

| # | Issue | Phase |
|---|-------|-------|
| 1 | GitHub secret scanning blocks push (inherited from P04 history) | Owner must allow via GitHub security UI |
| 2 | `@lifeos/security` has no `assertOAuthState` export — OAuth state check done inline | Phase 06 |
| 3 | OAuth provider credentials not yet configured | Phase 06 |
| 4 | `pages/route.test.ts` uses `'editor'` string not in `WorkspaceRole` union | Phase 06 cleanup |
