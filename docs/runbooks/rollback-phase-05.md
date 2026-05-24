# Rollback Runbook — Phase 05

**Branch:** `phase/05-zenith-ui-auth`  
**Rollback Target:** `phase-04-locked` tag  
**Estimated Time:** < 5 minutes  

---

## When to Use

- Auth routes returning 500 in production
- CSP header breaking the app for users
- Rate limiting incorrectly blocking legitimate users (false positives)
- Email rendering failure (all locales)
- Zenith UI breaking existing page layouts

---

## Step 1 — Immediate: Disable Auth Routes

If only auth routes are broken (app is otherwise working):

```bash
# Temporarily redirect auth routes to maintenance page
# In apps/web/middleware.ts, add early return for /api/v1/auth/*
# This is faster than a full rollback
```

## Step 2 — Full Rollback

```bash
# 1. Switch to Phase 04
git checkout phase-04-locked

# 2. Verify you're on the right commit
git log --oneline -1
# Should show: Phase 04 locked commit

# 3. Deploy Phase 04
# (follow your deployment runbook)

# 4. Notify team
echo "Phase 05 rolled back to Phase 04 locked. Reason: [describe issue]"
```

## Step 3 — Database Rollback (if needed)

Phase 05 migrations are **additive only** — they can be rolled back independently:

```sql
-- Rollback 0204 (indexes)
DROP INDEX IF EXISTS idx_audit_signin_failures;
DROP INDEX IF EXISTS idx_audit_signin_success;

-- Rollback 0203 (zenith_ui_preferences)
DROP TABLE IF EXISTS zenith_ui_preferences;

-- Rollback 0202 (email_templates_registry)
DROP TABLE IF EXISTS email_templates_registry;

-- Rollback 0201 (rate_limit_buckets.bucket_kind)
ALTER TABLE rate_limit_buckets DROP COLUMN IF EXISTS bucket_kind;

-- Rollback 0200 (users.locale)
ALTER TABLE users DROP COLUMN IF EXISTS locale;
```

> ⚠️ **WARNING:** Rolling back 0200 will lose locale preferences for all users.

## Step 4 — Verify Rollback

```bash
# Confirm Phase 04 auth guard is working
curl -X GET /api/v1/me -H "Cookie: lifeos_sid=invalid" 
# Expected: 401

# Confirm old signin route is working
curl -X POST /api/v1/auth/login -d '{"email":"test@test.com","password":"wrong"}'
# Expected: 401 AUTH_INVALID_CREDENTIALS
```

## Step 5 — Post-Incident

1. Create GitHub issue with root cause
2. Add regression test
3. Fix forward (do NOT re-apply Phase 05 without the fix)
4. Re-run CI gates: `pnpm typecheck && pnpm check:secrets`

---

## Rate Limiting False Positive (Partial Rollback)

If rate limiting is blocking legitimate users:

```sql
-- Clear all rate limit buckets immediately
DELETE FROM rate_limit_buckets WHERE bucket_kind = 'auth:signin';
DELETE FROM rate_limit_buckets WHERE bucket_kind = 'auth:signup';
DELETE FROM rate_limit_buckets WHERE bucket_kind = 'auth:reset';
```

No code deployment needed.
