# Phase 02 — Kernel: Auth + Workspaces + Pages Tree + RLS

<aside>
🔐

**هدف المرحلة الوحيد:** بناء النواة الآمنة للمنتج: Identity (users + sessions + magic-link + password-reset + email-verification + oauth_accounts) + Workspaces + Memberships + Profiles + Pages Tree + RLS صلب. الناتج النهائي = قاعدة بيانات محصّنة + 5 packages مؤمَّنة + API routes أساسية + tag `phase-02-locked` + `docs/execution/phase-02-outputs.md`. ممنوع: editor blocks، dashboards، AI، billing، حساسيّة من Phase 03+.

</aside>

## AI Executor Guide

<aside>
🤖

**اقرأ كل البنود بالترتيب 1 → آخر بند. لا تتجاوز خطوة.** كل خطوة تحتوي: ماذا تنفّذ، أين، الناتج المتوقع، DoD صغير. لو خطوة فشلت = توقّف واكتب السبب في `decisions-log.md` تحت D-XXX جديد ثم اطلب توجيه.

- **Branch:** `phase/02-kernel` (التسمية الموحدة `phase/NN-short-name` من [global-conventions.md](http://global-conventions.md) §19).
- **Exit tag:** `phase-02-locked` annotated (`git tag -a`).
- **Migration range:** 0100 → 0199 (محجوز من Phase 01).
- **Outputs contract:** `docs/execution/phase-02-outputs.md` إلزامي قبل القفل.
- **Rollback:** كل migration لها `-- ROLLBACK:` footer + تحديث `docs/runbooks/rollback.md` بقسم Phase 02.
</aside>

## 0. Preflight (Gate من Phase 01)

نفّذ قبل أي ملف جديد:

```bash
# 1) تأكّد من tag Phase 01 الموحد
git fetch --tags
git tag --list | grep -x phase-01-locked || { echo "BLOCKED: phase-01-locked tag missing"; exit 1; }

# 2) تأكّد من Inter-phase Contract
test -f docs/execution/phase-01-outputs.md || { echo "BLOCKED: phase-01-outputs.md missing"; exit 1; }

# 3) تأكّد من global conventions + rollback runbook
test -f docs/governance/global-conventions.md || { echo "BLOCKED: global-conventions.md missing"; exit 1; }
test -f docs/runbooks/rollback.md || { echo "BLOCKED: rollback.md missing"; exit 1; }

# 4) تأكّد من CI أخضر على main
pnpm install --frozen-lockfile
pnpm ci:guards
pnpm typecheck
pnpm lint --max-warnings 0
pnpm test

# 5) افتح branch Phase 02 بالتسمية الموحدة
git checkout -b phase/02-kernel
```

لو أي check فشل: لا تكتب أي ملف. وثّق السبب في `decisions-log.md` تحت `D-020`.

## 1. ملخص المرحلة و المخرجات المضمونة

**المخرجات المضمونة لـ Phase 03:**

1. **DB schema كامل للنواة** عبر migrations 0100→0118 (idempotent + reversible).
2. **5 packages جديدة:** `@lifeos/auth`، `@lifeos/auth-guard`، `@lifeos/workspaces`، `@lifeos/permissions`، `@lifeos/pages`.
3. **API routes أساسية:** `/api/v1/auth/*`، `/api/v1/me`، `/api/v1/workspaces/*`، `/api/v1/pages/*`، `/api/v1/invitations/*`.
4. **RLS مفعّل + FORCE** على كل tenant tables مع policy تعتمد `current_setting('app.current_workspace_id', true)`.
5. **`withWorkspaceContext`** كنقطة دخول وحيدة لكل query على tenant data.
6. **`recomputeDepthForSubtree`** + `assertNoCycle` لشجرة الصفحات.
7. **pgTAP suite** لكل migration حساسة (RLS، constraints، triggers).
8. **`docs/execution/phase-02-outputs.md`** مكتوب بالكامل.
9. **git tag `phase-02-locked`** مدفوع.
10. **`docs/runbooks/rollback.md`** يحتوي قسم Phase 02.

## 2. Required Inputs (اسأل المالك أولاً)

```markdown
أنا جاهز أبدأ Phase 02. محتاج:
1. DATABASE_URL (Postgres 15+) — dev local أو Supabase/Neon.
2. SESSION_COOKIE_NAME (افتراضي: lifeos_sid).
3. SESSION_TTL_DAYS (افتراضي: 30).
4. SESSION_PEPPER (random 32+ chars — يُولَّد عشوائياً ويُخزَّن في .env.local فقط).
5. MAGIC_LINK_TTL_MINUTES (افتراضي: 15).
6. PASSWORD_RESET_TTL_MINUTES (افتراضي: 60).
7. EMAIL_VERIFICATION_TTL_HOURS (افتراضي: 24).
8. APP_URL (لـ callbacks، افتراضي: http://localhost:3000).
9. هل OAuth providers مطلوبة الآن؟ (Phase 02 يجهّز الـ schema فقط، التطبيق في Phase 04).
10. هل الإيميل الحقيقي شغّال (SMTP) أم stub (طباعة في console للـ dev)؟
```

لو input إجباري ناقص:

```
BLOCKED: missing required input <name>
```

## 3. خريطة الملفات الكاملة

```
packages/
├── auth/
│   ├── src/
│   │   ├── password.ts              # bcrypt wrap (cost ≥ 12) + timing-safe equal
│   │   ├── session.ts               # createSession, validateSession, revokeSession, rotateOnPrivilegeChange
│   │   ├── tokens.ts                # createMagicLink, consumeMagicLink, createPasswordReset, etc.
│   │   ├── verification.ts          # email verification flow
│   │   ├── oauth.ts                 # oauth_accounts adapter (linking only — full flow in Phase 04)
│   │   ├── env.ts                   # reads SESSION_* + TTLs from @lifeos/shared/server-env
│   │   ├── workspace-context.ts     # withWorkspaceContext (single entry point)
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── auth-guard/
│   ├── src/
│   │   ├── requireUser.ts           # route guard: 401 if no valid session
│   │   ├── requireWorkspace.ts      # route guard: resolves workspaceId + membership
│   │   ├── requireCapability.ts     # route guard: capability check via @lifeos/permissions
│   │   ├── csrf.ts                  # double-submit cookie + Origin check
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── workspaces/
│   ├── src/
│   │   ├── workspace.service.ts     # create, update, archive, restore, transferOwnership
│   │   ├── membership.service.ts    # list, changeRole, remove, assertNotLastOwner
│   │   ├── invitation.service.ts    # create, accept, decline, revoke, expire (generic error)
│   │   ├── slug.ts                  # workspace slug normalization
│   │   ├── personal.ts              # ensurePersonalWorkspace on signup
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── permissions/
│   ├── src/
│   │   ├── capabilities.ts          # WorkspaceRole + Capability enums + ROLE_CAPABILITIES map
│   │   ├── resolver.ts              # assertCapability (single decision point)
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── pages/
│   ├── src/
│   │   ├── page.service.ts          # create, update, archive, restore, move (soft-archive only)
│   │   ├── tree.ts                  # assertNoCycle, recomputeDepthForSubtree, computePath
│   │   ├── slug.ts                  # page slug per workspace
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
└── db/
    └── migrations/
        ├── 0100__identity_users.sql
        ├── 0101__identity_sessions.sql
        ├── 0102__identity_magic_links.sql
        ├── 0103__identity_password_resets.sql
        ├── 0104__identity_email_verifications.sql
        ├── 0105__identity_oauth_accounts.sql
        ├── 0106__workspaces.sql
        ├── 0107__workspace_memberships.sql
        ├── 0108__workspace_invitations.sql
        ├── 0109__workspace_audit_events.sql
        ├── 0110__profiles.sql
        ├── 0111__pages.sql
        ├── 0112__pages_tree_triggers.sql
        ├── 0113__rls_helpers.sql
        ├── 0114__rls_enable_force.sql
        ├── 0115__rls_policies_workspaces.sql
        ├── 0116__rls_policies_memberships.sql
        ├── 0117__rls_policies_pages.sql
        └── 0118__seed_admin_role_check.sql

apps/web/src/app/api/v1/
├── auth/
│   ├── register/route.ts
│   ├── login/route.ts
│   ├── logout/route.ts
│   ├── magic-link/request/route.ts
│   ├── magic-link/consume/route.ts
│   ├── password-reset/request/route.ts
│   ├── password-reset/confirm/route.ts
│   └── verify-email/route.ts
├── me/route.ts
├── workspaces/
│   ├── route.ts
│   ├── [id]/route.ts
│   ├── [id]/members/route.ts
│   ├── [id]/members/[userId]/route.ts
│   └── [id]/invitations/route.ts
├── invitations/
│   ├── [token]/accept/route.ts
│   ├── [token]/decline/route.ts
│   └── [token]/route.ts
└── pages/
    ├── route.ts
    ├── [id]/route.ts
    ├── [id]/move/route.ts
    └── [id]/archive/route.ts

docs/
├── execution/
│   ├── phase-02-checklist.md
│   ├── phase-02-decisions-log.md
│   └── phase-02-outputs.md
├── adr/
│   ├── 0005-session-storage.md
│   ├── 0006-rls-context-strategy.md
│   ├── 0007-page-tree-depth-strategy.md
│   ├── 0008-invitation-generic-error.md
│   └── 0009-transfer-ownership-atomicity.md   (V1.1)
└── runbooks/
    └── rollback.md  (تحديث: قسم Phase 02)

scripts/
└── migrate.ts                                # V1.1: migration runner

tests/
├── pgtap/
│   ├── 0100_identity_users.sql
│   ├── 0106_workspaces.sql
│   ├── 0111_pages.sql
│   ├── 0114_rls_force.sql
│   └── 0117_rls_pages_isolation.sql
└── e2e/
    ├── auth-flow.test.ts
    ├── workspace-isolation.test.ts
    └── page-tree.test.ts
```

## 4. Steps 1 → 30 (خطي)

### Step 1 — Preflight Documentation

أنشئ `docs/execution/phase-02-preflight.md`:

```markdown
# Phase 02 Preflight
- phase-01-locked tag: ✅ present (sha: <fill>)
- phase-01-outputs.md: ✅ present
- global-conventions.md: ✅ §1–§22 readable
- rollback.md: ✅ Phase 01 section present
- CI status on main: ✅ green
- Branch: phase/02-kernel created
- Required inputs: <list collected from owner>
- Open blockers: none
```

**DoD:** الملف موجود، كل سطر مُلأ، blockers = none.

### Step 2 — Migration 0100: Identity / Users

`packages/db/migrations/0100__identity_users.sql`:

```sql
-- File: 0100__identity_users.sql
-- Phase: 02 (Kernel)
-- Description: Core users table — owns email, password hash, status.
-- Idempotent: YES
-- ROLLBACK: see footer.
BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,                       -- ULID
  email           CITEXT NOT NULL UNIQUE,
  email_verified  BOOLEAN NOT NULL DEFAULT false,
  password_hash   TEXT,                                   -- nullable (OAuth-only users)
  display_name    TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','suspended','deleted')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at   TIMESTAMPTZ,
  CONSTRAINT chk_users_email_format CHECK (position('@' in email) > 1)
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE status <> 'deleted';
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(lower(email::text));

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_users_email_lower;
--   DROP INDEX IF EXISTS idx_users_status;
--   DROP TABLE IF EXISTS users;
-- COMMIT;
```

**ملاحظة:** يتطلب `CREATE EXTENSION IF NOT EXISTS citext;` في migration setup مسبقاً (إن لم يكن، أضف في 0100 أعلى الـ BEGIN).

### Step 3 — Migration 0101: Sessions

`packages/db/migrations/0101__identity_sessions.sql`:

```sql
-- File: 0101__identity_sessions.sql
-- Phase: 02
-- Description: Server-side sessions (cookie carries opaque id; hash stored).
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY,                       -- ULID (cookie value derived via HMAC)
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,                   -- HMAC-SHA256(SESSION_PEPPER, raw_token)
  user_agent      TEXT,
  ip_inet         INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  CONSTRAINT chk_sessions_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_active
  ON sessions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_expires
  ON sessions(expires_at) WHERE revoked_at IS NULL;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_sessions_expires;
--   DROP INDEX IF EXISTS idx_sessions_user_active;
--   DROP TABLE IF EXISTS sessions;
-- COMMIT;
```

### Step 4 — Migration 0102: Magic Link Tokens

```sql
-- File: 0102__identity_magic_links.sql
-- Phase: 02
-- Description: One-time magic-link tokens (login without password).
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id              TEXT PRIMARY KEY,                       -- ULID
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  consumed_at     TIMESTAMPTZ,
  ip_inet         INET,
  CONSTRAINT chk_magic_link_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_magic_link_user_active
  ON magic_link_tokens(user_id) WHERE consumed_at IS NULL;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_magic_link_user_active;
--   DROP TABLE IF EXISTS magic_link_tokens;
-- COMMIT;
```

### Step 5 — Migration 0103: Password Reset Tokens

```sql
-- File: 0103__identity_password_resets.sql
-- Phase: 02
-- Description: One-time password-reset tokens.
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  consumed_at     TIMESTAMPTZ,
  CONSTRAINT chk_pwreset_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_pwreset_user_active
  ON password_reset_tokens(user_id) WHERE consumed_at IS NULL;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_pwreset_user_active;
--   DROP TABLE IF EXISTS password_reset_tokens;
-- COMMIT;
```

### Step 6 — Migration 0104: Email Verification Tokens

```sql
-- File: 0104__identity_email_verifications.sql
-- Phase: 02
-- Description: One-time email verification tokens.
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email           CITEXT NOT NULL,
  token_hash      TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  consumed_at     TIMESTAMPTZ,
  CONSTRAINT chk_emailver_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_emailver_user_active
  ON email_verification_tokens(user_id) WHERE consumed_at IS NULL;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_emailver_user_active;
--   DROP TABLE IF EXISTS email_verification_tokens;
-- COMMIT;
```

### Step 7 — Migration 0105: OAuth Accounts (Schema Only)

```sql
-- File: 0105__identity_oauth_accounts.sql
-- Phase: 02
-- Description: External OAuth account linking. Full provider flow lives in Phase 04.
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS oauth_accounts (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL
                  CHECK (provider IN ('google','github','microsoft')),
  provider_user_id TEXT NOT NULL,
  email_at_link   CITEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user ON oauth_accounts(user_id);

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_oauth_user;
--   DROP TABLE IF EXISTS oauth_accounts;
-- COMMIT;
```

### Step 8 — Migration 0106: Workspaces

```sql
-- File: 0106__workspaces.sql
-- Phase: 02
-- Description: Top-level tenant boundary.
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS workspaces (
  id              TEXT PRIMARY KEY,                       -- ULID
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'team'
                  CHECK (type IN ('personal','team')),
  owner_user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at     TIMESTAMPTZ,
  CONSTRAINT chk_workspace_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]{0,62}$')
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_active
  ON workspaces(id) WHERE archived_at IS NULL;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_workspaces_active;
--   DROP INDEX IF EXISTS idx_workspaces_owner;
--   DROP TABLE IF EXISTS workspaces;
-- COMMIT;
```

### Step 9 — Migration 0107: Memberships

```sql
-- File: 0107__workspace_memberships.sql
-- Phase: 02
-- Description: User membership in a workspace with role.
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS workspace_memberships (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL
                  CHECK (role IN ('owner','admin','member','viewer')),
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at      TIMESTAMPTZ,
  CONSTRAINT uq_membership UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_membership_user_active
  ON workspace_memberships(user_id) WHERE removed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_membership_workspace_active
  ON workspace_memberships(workspace_id) WHERE removed_at IS NULL;

-- Partial-unique to enforce "at least one owner per active workspace":
CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_owner_marker
  ON workspace_memberships(workspace_id)
  WHERE role = 'owner' AND removed_at IS NULL;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS uq_workspace_owner_marker;
--   DROP INDEX IF EXISTS idx_membership_workspace_active;
--   DROP INDEX IF EXISTS idx_membership_user_active;
--   DROP TABLE IF EXISTS workspace_memberships;
-- COMMIT;
```

**ملاحظة:** `uq_workspace_owner_marker` يضمن owner واحد بالضبط لكل workspace نشطة. **تحذير دقيق:** PostgreSQL لا يدعم `DEFERRABLE` على partial unique index، لذلك `transferOwnership` لا يمكن أن يكون INSERT لـ owner جديد ثم UPDATE للقديم داخل نفس tx — سيفشل عند الـ INSERT. **القاعدة الإلزامية في `workspace.service.ts.transferOwnership()`:** داخل tx واحد بالترتيب: (1) `UPDATE old_owner SET removed_at = now()`، (2) `UPDATE existing_membership SET role = 'owner'` للمستخدم الجديد (لو عضو بالفعل) أو INSERT جديد (إن لم يكن)، (3) audit event، (4) `rotateOnPrivilegeChange` لكلا المستخدمين. **ADR 0009** يوثّق هذا. لو احتجت أكتر من owner لاحقاً، احذف هذا index في phase لاحقة.

### Step 10 — Migration 0108: Invitations

```sql
-- File: 0108__workspace_invitations.sql
-- Phase: 02
-- Description: Workspace invitations (token-based).
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS workspace_invitations (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email           CITEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('admin','member','viewer')),
  token_hash      TEXT NOT NULL UNIQUE,
  invited_by      TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  accepted_at     TIMESTAMPTZ,
  declined_at     TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,
  CONSTRAINT chk_invite_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_invitation_workspace_active
  ON workspace_invitations(workspace_id)
  WHERE accepted_at IS NULL AND declined_at IS NULL AND revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invitation_email
  ON workspace_invitations(email);

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_invitation_email;
--   DROP INDEX IF EXISTS idx_invitation_workspace_active;
--   DROP TABLE IF EXISTS workspace_invitations;
-- COMMIT;
```

### Step 11 — Migration 0109: Audit Events

```sql
-- File: 0109__workspace_audit_events.sql
-- Phase: 02
-- Description: Append-only audit log for tenant-significant actions.
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS workspace_audit_events (
  id              TEXT PRIMARY KEY,
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_user_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  event_type      TEXT NOT NULL,                          -- e.g. 'member.role_changed'
  subject_type    TEXT,                                   -- e.g. 'membership'
  subject_id      TEXT,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_workspace_time
  ON workspace_audit_events(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_type
  ON workspace_audit_events(event_type);

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_audit_event_type;
--   DROP INDEX IF EXISTS idx_audit_workspace_time;
--   DROP TABLE IF EXISTS workspace_audit_events;
-- COMMIT;
```

### Step 12 — Migration 0110: Profiles

```sql
-- File: 0110__profiles.sql
-- Phase: 02
-- Description: Per-user profile data (separated from auth-critical users table).
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS profiles (
  user_id         TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  avatar_url      TEXT,
  bio             TEXT NOT NULL DEFAULT '',
  timezone        TEXT NOT NULL DEFAULT 'UTC',
  locale          TEXT NOT NULL DEFAULT 'en',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP TABLE IF EXISTS profiles;
-- COMMIT;
```

### Step 13 — Migration 0111: Pages

```sql
-- File: 0111__pages.sql
-- Phase: 02
-- Description: Pages tree per workspace (depth ≤ 50, soft archive, soft delete).
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS pages (
  id              TEXT PRIMARY KEY,                       -- ULID
  workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id       TEXT REFERENCES pages(id) ON DELETE CASCADE,
  title           TEXT NOT NULL DEFAULT '',
  slug            TEXT NOT NULL,
  position        INT  NOT NULL DEFAULT 0,
  depth           INT  NOT NULL DEFAULT 0,
  created_by      TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at     TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,
  is_deleted      BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT chk_pages_depth_max CHECK (depth >= 0 AND depth <= 50),
  CONSTRAINT uq_pages_workspace_slug UNIQUE (workspace_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_pages_workspace_parent_pos
  ON pages(workspace_id, parent_id, position);
CREATE INDEX IF NOT EXISTS idx_pages_workspace_active
  ON pages(workspace_id) WHERE is_deleted = false AND archived_at IS NULL;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP INDEX IF EXISTS idx_pages_workspace_active;
--   DROP INDEX IF EXISTS idx_pages_workspace_parent_pos;
--   DROP TABLE IF EXISTS pages;
-- COMMIT;
```

### Step 14 — Migration 0112: Pages Tree Triggers (depth maintenance)

```sql
-- File: 0112__pages_tree_triggers.sql
-- Phase: 02
-- Description: Triggers to keep depth consistent on INSERT/UPDATE.
-- Idempotent: YES
BEGIN;

CREATE OR REPLACE FUNCTION fn_pages_compute_depth() RETURNS TRIGGER AS $$
DECLARE
  parent_depth INT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.depth := 0;
  ELSE
    SELECT depth INTO parent_depth
      FROM pages
     WHERE id = NEW.parent_id
       AND workspace_id = NEW.workspace_id;
    IF parent_depth IS NULL THEN
      RAISE EXCEPTION 'PAGE_PARENT_NOT_IN_WORKSPACE' USING ERRCODE = '22000';
    END IF;
    NEW.depth := parent_depth + 1;
    IF NEW.depth > 50 THEN
      RAISE EXCEPTION 'PAGE_DEPTH_EXCEEDED' USING ERRCODE = '22000';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pages_compute_depth_ins ON pages;
CREATE TRIGGER trg_pages_compute_depth_ins
  BEFORE INSERT ON pages
  FOR EACH ROW EXECUTE FUNCTION fn_pages_compute_depth();

DROP TRIGGER IF EXISTS trg_pages_compute_depth_upd ON pages;
CREATE TRIGGER trg_pages_compute_depth_upd
  BEFORE UPDATE OF parent_id ON pages
  FOR EACH ROW
  WHEN (NEW.parent_id IS DISTINCT FROM OLD.parent_id)
  EXECUTE FUNCTION fn_pages_compute_depth();

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP TRIGGER IF EXISTS trg_pages_compute_depth_upd ON pages;
--   DROP TRIGGER IF EXISTS trg_pages_compute_depth_ins ON pages;
--   DROP FUNCTION IF EXISTS fn_pages_compute_depth();
-- COMMIT;
```

**ملاحظة:** التريجر يضبط `depth` للسطر المتغيّر فقط. تحديث الـ depth للـ subtree (لما parent يتنقل) يحدث في الـ application layer عبر `recomputeDepthForSubtree` (Step 23).

### Step 15 — Migration 0113: RLS Helpers

```sql
-- File: 0113__rls_helpers.sql
-- Phase: 02
-- Description: Stable SQL helpers used inside RLS policies.
-- Idempotent: YES
BEGIN;

CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION app_current_workspace_id() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.current_workspace_id', true), '')
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION app_is_member(_workspace_id TEXT) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_memberships m
     WHERE m.workspace_id = _workspace_id
       AND m.user_id = app_current_user_id()
       AND m.removed_at IS NULL
  )
$$ LANGUAGE SQL STABLE;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP FUNCTION IF EXISTS app_is_member(TEXT);
--   DROP FUNCTION IF EXISTS app_current_workspace_id();
--   DROP FUNCTION IF EXISTS app_current_user_id();
-- COMMIT;
```

### Step 16 — Migration 0114: RLS Enable + FORCE

```sql
-- File: 0114__rls_enable_force.sql
-- Phase: 02
-- Description: Enable + FORCE RLS on every tenant table.
-- Idempotent: YES
BEGIN;

ALTER TABLE workspaces             ENABLE  ROW LEVEL SECURITY;
ALTER TABLE workspaces             FORCE   ROW LEVEL SECURITY;
ALTER TABLE workspace_memberships  ENABLE  ROW LEVEL SECURITY;
ALTER TABLE workspace_memberships  FORCE   ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations  ENABLE  ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations  FORCE   ROW LEVEL SECURITY;
ALTER TABLE workspace_audit_events ENABLE  ROW LEVEL SECURITY;
ALTER TABLE workspace_audit_events FORCE   ROW LEVEL SECURITY;
ALTER TABLE pages                  ENABLE  ROW LEVEL SECURITY;
ALTER TABLE pages                  FORCE   ROW LEVEL SECURITY;

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   ALTER TABLE pages                  DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE pages                  NO FORCE ROW LEVEL SECURITY;
--   ALTER TABLE workspace_audit_events DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE workspace_audit_events NO FORCE ROW LEVEL SECURITY;
--   ALTER TABLE workspace_invitations  DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE workspace_invitations  NO FORCE ROW LEVEL SECURITY;
--   ALTER TABLE workspace_memberships  DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE workspace_memberships  NO FORCE ROW LEVEL SECURITY;
--   ALTER TABLE workspaces             DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE workspaces             NO FORCE ROW LEVEL SECURITY;
-- COMMIT;
```

### Step 17 — Migration 0115: RLS Policies (workspaces + memberships visibility)

```sql
-- File: 0115__rls_policies_workspaces.sql
-- Phase: 02
-- Description: A user sees only workspaces they belong to.
-- Idempotent: YES
BEGIN;

DROP POLICY IF EXISTS p_workspaces_member_read ON workspaces;
CREATE POLICY p_workspaces_member_read ON workspaces
  FOR SELECT
  USING (app_is_member(id));

DROP POLICY IF EXISTS p_workspaces_owner_write ON workspaces;
CREATE POLICY p_workspaces_owner_write ON workspaces
  FOR UPDATE
  USING (id = app_current_workspace_id() AND app_is_member(id))
  WITH CHECK (id = app_current_workspace_id() AND app_is_member(id));

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP POLICY IF EXISTS p_workspaces_owner_write ON workspaces;
--   DROP POLICY IF EXISTS p_workspaces_member_read ON workspaces;
-- COMMIT;
```

### Step 18 — Migration 0116: RLS Policies (memberships + invitations + audit)

```sql
-- File: 0116__rls_policies_memberships.sql
-- Phase: 02
-- Description: Membership rows visible only within member's own workspaces.
-- Idempotent: YES
BEGIN;

DROP POLICY IF EXISTS p_memberships_isolation ON workspace_memberships;
CREATE POLICY p_memberships_isolation ON workspace_memberships
  USING (app_is_member(workspace_id))
  WITH CHECK (app_is_member(workspace_id));

DROP POLICY IF EXISTS p_invitations_isolation ON workspace_invitations;
CREATE POLICY p_invitations_isolation ON workspace_invitations
  USING (app_is_member(workspace_id))
  WITH CHECK (app_is_member(workspace_id));

DROP POLICY IF EXISTS p_audit_isolation ON workspace_audit_events;
CREATE POLICY p_audit_isolation ON workspace_audit_events
  USING (app_is_member(workspace_id))
  WITH CHECK (app_is_member(workspace_id));

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP POLICY IF EXISTS p_audit_isolation ON workspace_audit_events;
--   DROP POLICY IF EXISTS p_invitations_isolation ON workspace_invitations;
--   DROP POLICY IF EXISTS p_memberships_isolation ON workspace_memberships;
-- COMMIT;
```

### Step 19 — Migration 0117: RLS Policies (pages)

```sql
-- File: 0117__rls_policies_pages.sql
-- Phase: 02
-- Description: Page rows isolated by current_workspace_id (set via withWorkspaceContext).
-- Idempotent: YES
BEGIN;

DROP POLICY IF EXISTS p_pages_isolation ON pages;
CREATE POLICY p_pages_isolation ON pages
  USING (workspace_id = app_current_workspace_id())
  WITH CHECK (workspace_id = app_current_workspace_id());

COMMIT;

-- ROLLBACK:
-- BEGIN;
--   DROP POLICY IF EXISTS p_pages_isolation ON pages;
-- COMMIT;
```

### Step 20 — Migration 0118: Admin Role Check (smoke)

```sql
-- File: 0118__seed_admin_role_check.sql
-- Phase: 02
-- Description: NO seed data. Pure assertion: at least one role exists in CHECK.
--              Acts as a smoke test that the migration chain completed.
-- Idempotent: YES
BEGIN;

DO $$
BEGIN
  PERFORM 1
    FROM information_schema.check_constraints
   WHERE constraint_name = 'workspace_memberships_role_check';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Phase 02 smoke failed: role CHECK missing';
  END IF;
END $$;

COMMIT;

-- ROLLBACK:
-- (no-op — assertion only)
```

### Step 21 — Package: `@lifeos/auth/password.ts`

```tsx
import bcrypt from 'bcryptjs'
import { timingSafeEqual } from 'node:crypto'

const COST = 12

export async function hashPassword(plain: string): Promise<string> {
	return bcrypt.hash(plain, COST)
}

export async function verifyPassword(
	plain: string,
	hash: string,
): Promise<boolean> {
	return bcrypt.compare(plain, hash)
}

export function safeEqual(a: string, b: string): boolean {
	const ba = Buffer.from(a)
	const bb = Buffer.from(b)
	if (ba.length !== bb.length) return false
	return timingSafeEqual(ba, bb)
}
```

### Step 21.5 — Extend `@lifeos/shared/server-env`

**موقع:** `packages/shared/src/server-env.ts` (الموجود من Phase 01).

**القرار (D-029):** Phase 02 يوسّع schema الـ `ServerEnv`؛ لا يفرّع ولا يستبدل.

```tsx
import { z } from 'zod'

const ServerEnvSchema = z.object({
	// From Phase 01
	NODE_ENV: z.enum(['development', 'test', 'production']),
	DATABASE_URL: z.string().min(1),
	// NEW in Phase 02
	APP_URL: z.string().url(),
	SESSION_PEPPER: z.string().min(32),
	SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
	SESSION_COOKIE_NAME: z.string().default('lifeos_sid'),
	MAGIC_LINK_TTL_MINUTES: z.coerce.number().int().positive().default(15),
	PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(60),
	EMAIL_VERIFICATION_TTL_HOURS: z.coerce.number().int().positive().default(24),
})

export type ServerEnv = z.infer<typeof ServerEnvSchema>

let cached: ServerEnv | null = null
export function getServerEnv(): ServerEnv {
	if (cached) return cached
	cached = ServerEnvSchema.parse(process.env)
	return cached
}
export function resetServerEnvCache(): void { cached = null }
```

**DoD:** test يتأكد أن `getServerEnv()` يقرأ كل الحقول الجديدة، ويرفض `SESSION_PEPPER` < 32 chars.

### Step 22 — Package: `@lifeos/auth/session.ts`

```tsx
import { createHmac, randomBytes } from 'node:crypto'
import { newUlid, systemClock } from '@lifeos/shared'
import type { DbClient } from '@lifeos/db'
import { getServerEnv } from '@lifeos/shared/server-env'

// last_seen_at write is throttled to once per LAST_SEEN_THROTTLE_MS per session.
const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000

function hashToken(raw: string): string {
	const { SESSION_PEPPER } = getServerEnv()
	return createHmac('sha256', SESSION_PEPPER).update(raw).digest('hex')
}

export type CreateSessionInput = {
	userId: string
	userAgent: string | null
	ip: string | null
}

export async function createSession(
	db: DbClient,
	input: CreateSessionInput,
): Promise<{ sessionId: string; rawToken: string; expiresAt: Date }> {
	const { SESSION_TTL_DAYS } = getServerEnv()
	const rawToken = randomBytes(32).toString('base64url')
	const id = newUlid()
	const nowMs = systemClock.nowMs()
	const expires = new Date(nowMs + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)
	await db.none(
		`INSERT INTO sessions (id, user_id, token_hash, user_agent, ip_inet, expires_at)
		 VALUES ($1, $2, $3, $4, $5::inet, $6)`,
		[id, input.userId, hashToken(rawToken), input.userAgent, input.ip, expires],
	)
	return { sessionId: id, rawToken, expiresAt: expires }
}

export async function validateSession(
	db: DbClient,
	rawToken: string,
): Promise<{ userId: string; sessionId: string } | null> {
	const row = await db.oneOrNone<{
		id: string
		user_id: string
		expires_at: Date
		revoked_at: Date | null
		last_seen_at: Date
	}>(
		`SELECT id, user_id, expires_at, revoked_at, last_seen_at
		   FROM sessions
		  WHERE token_hash = $1`,
		[hashToken(rawToken)],
	)
	if (!row) return null
	if (row.revoked_at) return null
	const nowMs = systemClock.nowMs()
	if (row.expires_at.getTime() <= nowMs) return null
	// throttle last_seen_at writes to reduce per-request UPDATE pressure.
	if (nowMs - row.last_seen_at.getTime() > LAST_SEEN_THROTTLE_MS) {
		await db.none(
			`UPDATE sessions SET last_seen_at = now() WHERE id = $1`,
			[row.id],
		)
	}
	return { userId: row.user_id, sessionId: row.id }
}

export async function revokeSession(db: DbClient, sessionId: string): Promise<void> {
	await db.none(
		`UPDATE sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`,
		[sessionId],
	)
}

export async function rotateOnPrivilegeChange(
	db: DbClient,
	userId: string,
): Promise<void> {
	await db.none(
		`UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
		[userId],
	)
}
```

### Step 23 — Package: `@lifeos/auth/workspace-context.ts`

```tsx
import type { DbClient } from '@lifeos/db'

export async function withWorkspaceContext<T>(
	db: DbClient,
	params: { userId: string; workspaceId: string },
	fn: (tx: DbClient) => Promise<T>,
): Promise<T> {
	return db.tx(async (tx) => {
		await tx.none(`SELECT set_config('app.current_user_id', $1, true)`, [params.userId])
		await tx.none(`SELECT set_config('app.current_workspace_id', $1, true)`, [params.workspaceId])
		return fn(tx)
	})
}
```

**قواعد إلزامية:**

- ممنوع أي query على tenant table خارج `withWorkspaceContext`.
- ممنوع أخذ `workspaceId` من client بدون verification في `requireWorkspace`.
- `set_config(..., true)` يعني local-to-transaction.

### Step 24 — Package: `@lifeos/permissions/capabilities.ts`

```tsx
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'

export type Capability =
	| 'workspace:update'
	| 'workspace:archive'
	| 'workspace:transfer_ownership'
	| 'member:list'
	| 'member:invite'
	| 'member:update_role'
	| 'member:remove'
	| 'invitation:revoke'
	| 'page:create'
	| 'page:read'
	| 'page:update'
	| 'page:move'
	| 'page:archive'
	| 'page:delete'

export const ROLE_CAPABILITIES: Record<WorkspaceRole, readonly Capability[]> = {
	owner: [
		'workspace:update', 'workspace:archive', 'workspace:transfer_ownership',
		'member:list', 'member:invite', 'member:update_role', 'member:remove',
		'invitation:revoke',
		'page:create', 'page:read', 'page:update', 'page:move', 'page:archive', 'page:delete',
	],
	admin: [
		'workspace:update',
		'member:list', 'member:invite', 'member:update_role', 'member:remove',
		'invitation:revoke',
		'page:create', 'page:read', 'page:update', 'page:move', 'page:archive', 'page:delete',
	],
	member: [
		'member:list',
		'page:create', 'page:read', 'page:update', 'page:move', 'page:archive',
	],
	viewer: ['page:read'],
} as const

export function roleHasCapability(role: WorkspaceRole, capability: Capability): boolean {
	return ROLE_CAPABILITIES[role].includes(capability)
}
```

### Step 25 — Package: `@lifeos/permissions/resolver.ts`

```tsx
import { AppError } from '@lifeos/shared'
import { roleHasCapability, type Capability, type WorkspaceRole } from './capabilities'

export type PermissionSubject = {
	userId: string
	workspaceId: string
	role: WorkspaceRole
}

export function assertCapability(
	subject: PermissionSubject,
	capability: Capability,
): void {
	if (!roleHasCapability(subject.role, capability)) {
		// V1.1: HTTP status is resolved centrally via STATUS_MAP in @lifeos/shared/errors.
		throw new AppError(
			'AUTH_FORBIDDEN',
			'You do not have permission to perform this action',
		)
	}
}
```

**القاعدة:** `resolver.ts` هو المكان الوحيد لقرار الصلاحية. ممنوع تكرار `if (role === 'owner')` في routes أو UI.

### Step 26 — Package: `@lifeos/pages/tree.ts` (cycle + depth recompute)

```tsx
import type { DbClient } from '@lifeos/db'
import { AppError } from '@lifeos/shared'

const MAX_DEPTH = 50

// ACTION REQUIRED (D-030): the while-loop body below performs up to MAX_DEPTH
// queries per move (N+1). Replace with a single recursive CTE before shipping:
//   const ancestors = await db.many<{ id: string }>(
//     `WITH RECURSIVE anc AS (<br>//        SELECT id, parent_id, 0 AS level FROM pages<br>//         WHERE id = $1 AND workspace_id = $2 AND is_deleted = false<br>//        UNION ALL<br>//        SELECT p.id, p.parent_id, a.level + 1<br>//          FROM pages p JOIN anc a ON p.id = a.parent_id<br>//         WHERE p.workspace_id = $2 AND p.is_deleted = false AND a.level < $3<br>//      ) SELECT id FROM anc`,
//     [newParentId, workspaceId, MAX_DEPTH + 1],
//   )
//   if (ancestors.some(a => a.id === pageId))
//     throw new AppError('PAGE_INVALID_MOVE', 'Move would create a cycle')
//   if (ancestors.length > MAX_DEPTH)
//     throw new AppError('PAGE_INVALID_MOVE', 'Depth exceeds maximum')
export async function assertNoCycle(
	db: DbClient,
	pageId: string,
	newParentId: string | null,
	workspaceId: string,
): Promise<void> {
	if (newParentId === null) return
	if (newParentId === pageId) {
		throw new AppError('PAGE_INVALID_MOVE', 'A page cannot be its own parent')
	}
	let cursor: string | null = newParentId
	let depth = 0
	while (cursor !== null) {
		if (cursor === pageId) {
			throw new AppError('PAGE_INVALID_MOVE', 'Move would create a cycle')
		}
		if (++depth > MAX_DEPTH) {
			throw new AppError('PAGE_INVALID_MOVE', 'Depth exceeds maximum')
		}
		const row = await db.oneOrNone<{ parent_id: string | null }>(
			`SELECT parent_id FROM pages
			  WHERE id = $1 AND workspace_id = $2 AND is_deleted = false`,
			[cursor, workspaceId],
		)
		cursor = row?.parent_id ?? null
	}
}

export async function recomputeDepthForSubtree(
	db: DbClient,
	rootId: string,
	workspaceId: string,
): Promise<void> {
	// BFS using a recursive CTE update.
	await db.none(
		`WITH RECURSIVE subtree AS (
			SELECT id, parent_id, 0 AS new_depth FROM pages
			 WHERE id = $1 AND workspace_id = $2
			UNION ALL
			SELECT p.id, p.parent_id, s.new_depth + 1
			  FROM pages p
			  JOIN subtree s ON p.parent_id = s.id
			 WHERE p.workspace_id = $2
		)
		UPDATE pages SET depth = s.new_depth
		  FROM subtree s
		 WHERE pages.id = s.id AND pages.workspace_id = $2`,
		[rootId, workspaceId],
	)
}

// move() in page.service.ts MUST run inside withWorkspaceContext AND MUST call
// (in this exact order, inside one tx):
//   await assertNoCycle(tx, pageId, newParentId, workspaceId)
//   await tx.none(
//     `UPDATE pages SET parent_id = $1, updated_at = now()<br>//        WHERE id = $2 AND workspace_id = $3`,
//     [newParentId, pageId, workspaceId],
//   )
//   await recomputeDepthForSubtree(tx, pageId, workspaceId)
// Skipping the recompute corrupts descendant depths and breaks chk_pages_depth_max.
```

**ملاحظة إلزامية (V1.1) — `page.service.ts.move()`:** داخل tx واحد عبر `withWorkspaceContext` **يجب** التنفيذ بالترتيب: (1) `await assertNoCycle(tx, pageId, newParentId, workspaceId)`، (2) `UPDATE pages SET parent_id = $1, updated_at = now() WHERE id = $2 AND workspace_id = $3`، (3) `await recomputeDepthForSubtree(tx, pageId, workspaceId)`. تخطّي خطوة (3) يفسد depth للأبناء ويكسر `chk_pages_depth_max`. راجع D-023 و D-030.

### Step 27 — Package: `@lifeos/workspaces/invitation.service.ts` (generic error)

```tsx
import { AppError } from '@lifeos/shared'

// function form (not singleton) — every call returns a fresh Error instance
// so stack traces / metadata stay request-scoped, and the 2-arg AppError signature
// lets STATUS_MAP resolve HTTP 400 centrally.
export function invitationGenericError(): AppError {
	return new AppError(
		'INVITATION_INVALID',
		'Invitation link is invalid or has expired.',
	)
}

// All these internal states map to invitationGenericError() before responding:
// - token not found
// - token expired
// - token already accepted
// - token revoked
// - email mismatch (signed-in user's email != invitation email)
```

**ADR 0008** يوثّق هذا القرار لتفادي email/workspace enumeration.

### Step 27.5 — Finalize `withWorkspaceRoute`

**موقع:** `packages/route/src/with-workspace-route.ts` (placeholder أُنشئ في Phase 01؛ Phase 02 يستبدل المحتوى بالكامل).

**القرار (D-032):** بدون هذه الخطوة، كل routes Phase 02 سترجع 401 دائماً.

```tsx
import { cookies } from 'next/headers'
import { withApiErrorHandling } from './with-api-error-handling'
import { AppError } from '@lifeos/shared'
import { dbClient } from '@lifeos/db'
import { validateSession, withWorkspaceContext } from '@lifeos/auth'
import { getServerEnv } from '@lifeos/shared/server-env'
import type { WorkspaceRole } from '@lifeos/permissions'
import type { DbClient } from '@lifeos/db'

export type WorkspaceRouteContext = {
	req: Request
	userId: string
	workspaceId: string
	role: WorkspaceRole
	tx: DbClient
}

export function withWorkspaceRoute(
	handler: (ctx: WorkspaceRouteContext) => Promise<Response>,
) {
	return withApiErrorHandling(async (req: Request) => {
		const { SESSION_COOKIE_NAME } = getServerEnv()
		const cookieStore = await cookies()
		const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value
		if (!raw) throw new AppError('AUTH_REQUIRED', 'Sign in required')

		const session = await validateSession(dbClient, raw)
		if (!session) throw new AppError('SESSION_INVALID', 'Session is invalid or expired')

		const url = new URL(req.url)
		const workspaceId =
			req.headers.get('X-Workspace-Id') ??
			url.searchParams.get('workspaceId') ??
			null
		if (!workspaceId) throw new AppError('MEMBERSHIP_REQUIRED', 'Workspace context missing')

		const membership = await dbClient.oneOrNone<{ role: WorkspaceRole }>(
			`SELECT role FROM workspace_memberships
			  WHERE workspace_id = $1 AND user_id = $2 AND removed_at IS NULL`,
			[workspaceId, session.userId],
		)
		// 404 (not 403) on non-member to avoid leaking workspace existence.
		if (!membership) throw new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found')

		return withWorkspaceContext(
			dbClient,
			{ userId: session.userId, workspaceId },
			async (tx) =>
				handler({ req, userId: session.userId, workspaceId, role: membership.role, tx }),
		)
	})
}
```

**DoD:** E2E auth-flow ينجح؛ E2E workspace-isolation يرى 404 (ليس 403) عند workspaceId غريب.

### Step 27.6 — Migration runner: `scripts/migrate.ts`

**موقع:** `scripts/migrate.ts` على root الريبو (بجوار `vitest.config.ts` و scripts أخرى من Phase 00/01).

**`package.json` scripts (تحديث root):**

```json
{
	"scripts": {
		"db:migrate": "tsx scripts/migrate.ts",
		"db:migrate:dry": "tsx scripts/migrate.ts --dry-run"
	}
}
```

```tsx
#!/usr/bin/env tsx
/**
 * Migration runner — applies packages/db/migrations/*.sql in lexical order.
 * - Tracks applied migrations in schema_migrations table.
 * - Each migration file must be idempotent (CREATE TABLE IF NOT EXISTS ...).
 * - Use --dry-run to preview without applying.
 * - Use --to <NNNN> to apply up to a specific migration number.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import postgres from 'postgres'
import { getServerEnv } from '@lifeos/shared/server-env'

const MIG_DIR = 'packages/db/migrations'

async function main() {
	const env = getServerEnv()
	const sql = postgres(env.DATABASE_URL, { onnotice: () => {} })
	const dryRun = process.argv.includes('--dry-run')
	const toIdx = process.argv.indexOf('--to')
	const toCap = toIdx >= 0 ? process.argv[toIdx + 1] : null

	await sql`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			id        TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			checksum  TEXT NOT NULL
		)
	`
	const rows = await sql<{ id: string }[]>`SELECT id FROM schema_migrations`
	const applied = new Set(rows.map((r) => r.id))

	const files = readdirSync(MIG_DIR)
		.filter((f) => f.endsWith('.sql'))
		.sort((a, b) => a.localeCompare(b))

	for (const file of files) {
		const id = file.split('__')[0]
		if (toCap && id > toCap) break
		if (applied.has(id)) {
			console.log(`✓ skip ${file} (already applied)`)
			continue
		}
		const body = readFileSync(join(MIG_DIR, file), 'utf8')
		// Strip the ROLLBACK footer; only the UP block runs.
		const upOnly = body.replace(/-- ROLLBACK:[\s\S]*$/m, '').trim()
		const checksum = createHash('sha256').update(upOnly).digest('hex')
		if (dryRun) {
			console.log(`→ would apply ${file} (sha=${checksum.slice(0, 12)})`)
			continue
		}
		await sql.begin(async (tx) => {
			await tx.unsafe(upOnly)
			await tx`INSERT INTO schema_migrations (id, checksum) VALUES (${id}, ${checksum})`
		})
		console.log(`✓ applied ${file}`)
	}
	await sql.end()
}

main().catch((e) => {
	console.error('migration failed:', e)
	process.exit(1)
})
```

**DoD:** `pnpm db:migrate` يطبّق 0100..0118 على dev DB نظيف بدون خطأ. إعادة التشغيل ترجع `skip` لكل الملفات (idempotent).

### Step 28 — API Routes (مرجع — `apps/web/src/app/api/v1/pages/route.ts`)

```tsx
import { withWorkspaceRoute, requireIdempotencyKey, parseJsonBody } from '@lifeos/route'
import { requireCapability } from '@lifeos/auth-guard'
import { pageService } from '@lifeos/pages'
import { okEnvelope } from '@lifeos/shared'
import { z } from 'zod'

const CreatePageBody = z.object({
	title: z.string().min(1).max(200),
	parentId: z.string().nullable().optional(),
})

export const POST = withWorkspaceRoute(async ({ req, workspaceId, userId, role }) => {
	await requireIdempotencyKey(req)
	requireCapability({ userId, workspaceId, role }, 'page:create')
	const body = await parseJsonBody(req, CreatePageBody)
	const page = await pageService.createPage({
		workspaceId,
		userId,
		title: body.title,
		parentId: body.parentId ?? null,
	})
	return Response.json(okEnvelope(page), { status: 201 })
})
```

### Step 29 — pgTAP Test: RLS isolation

`tests/pgtap/0117_rls_pages_isolation.sql`:

```sql
BEGIN;
SELECT plan(4);

-- V1.1: FORCE RLS applies to table owners too. The pgTAP runner must run as
-- a role with BYPASSRLS, OR setup must temporarily disable row_security.
-- Here we use SET LOCAL row_security = off; valid when the pgTAP role has BYPASSRLS
-- (recommended for CI).
SET LOCAL row_security = off;

-- Setup (RLS bypassed for fixture insertion only)
INSERT INTO users (id, email) VALUES ('u_a', 'a@test'), ('u_b', 'b@test');
INSERT INTO workspaces (id, slug, name, owner_user_id) VALUES
  ('w_a', 'a-ws', 'A WS', 'u_a'),
  ('w_b', 'b-ws', 'B WS', 'u_b');
INSERT INTO workspace_memberships (id, workspace_id, user_id, role) VALUES
  ('m_a', 'w_a', 'u_a', 'owner'),
  ('m_b', 'w_b', 'u_b', 'owner');
INSERT INTO pages (id, workspace_id, title, slug, created_by) VALUES
  ('p_a', 'w_a', 'Page A', 'page-a', 'u_a'),
  ('p_b', 'w_b', 'Page B', 'page-b', 'u_b');

-- V1.1: re-enable row_security for the actual assertions.
SET LOCAL row_security = on;

-- Context = user A in workspace A
SELECT set_config('app.current_user_id', 'u_a', true);
SELECT set_config('app.current_workspace_id', 'w_a', true);

SELECT is((SELECT count(*) FROM pages)::int, 1, 'User A sees only their workspace pages');
SELECT is((SELECT id FROM pages LIMIT 1), 'p_a', 'Visible page is p_a');

-- Switch context to B
SELECT set_config('app.current_user_id', 'u_b', true);
SELECT set_config('app.current_workspace_id', 'w_b', true);

SELECT is((SELECT count(*) FROM pages)::int, 1, 'User B sees only their workspace pages');
SELECT is((SELECT id FROM pages LIMIT 1), 'p_b', 'Visible page is p_b');

ROLLBACK;
```

### Step 30 — Tests checklist

يجب أن توجد على الأقل:

```
packages/permissions/src/__tests__/capabilities.test.ts
packages/permissions/src/__tests__/resolver.test.ts
packages/pages/src/__tests__/tree-cycle.test.ts
packages/pages/src/__tests__/recompute-depth.test.ts
packages/workspaces/src/__tests__/last-owner.test.ts
packages/workspaces/src/__tests__/transfer-ownership-atomicity.test.ts
packages/workspaces/src/__tests__/invitation-generic-error.test.ts
packages/auth/src/__tests__/session-lifecycle.test.ts
packages/auth/src/__tests__/password-hash.test.ts
packages/auth/src/__tests__/workspace-context.test.ts
tests/pgtap/0114_rls_force.sql
tests/pgtap/0117_rls_pages_isolation.sql
tests/e2e/auth-flow.test.ts
tests/e2e/workspace-isolation.test.ts
tests/e2e/page-tree.test.ts
```

### Step 31 — `docs/execution/phase-02-checklist.md` (محتوى كامل)

```markdown
# Phase 02 — Checklist

## A. Preflight
- [ ] phase-01-locked tag exists
- [ ] phase-01-outputs.md verified
- [ ] global-conventions.md present
- [ ] rollback.md has Phase 01 section
- [ ] CI green on main
- [ ] Branch `phase/02-kernel` opened

## B. Migrations 0100 → 0118
- [ ] 0100 users
- [ ] 0101 sessions
- [ ] 0102 magic_link_tokens
- [ ] 0103 password_reset_tokens
- [ ] 0104 email_verification_tokens
- [ ] 0105 oauth_accounts
- [ ] 0106 workspaces
- [ ] 0107 workspace_memberships (uq_workspace_owner_marker)
- [ ] 0108 workspace_invitations
- [ ] 0109 workspace_audit_events
- [ ] 0110 profiles
- [ ] 0111 pages
- [ ] 0112 pages tree triggers
- [ ] 0113 RLS helpers (app_current_user_id, app_current_workspace_id, app_is_member)
- [ ] 0114 RLS enable + FORCE on all tenant tables
- [ ] 0115 RLS policies workspaces
- [ ] 0116 RLS policies memberships + invitations + audit
- [ ] 0117 RLS policies pages
- [ ] 0118 smoke assertion
- [ ] every migration has -- ROLLBACK: footer

## C. Packages
- [ ] @lifeos/auth (password, session, tokens, verification, oauth, workspace-context)
- [ ] @lifeos/auth-guard (requireUser, requireWorkspace, requireCapability, csrf)
- [ ] @lifeos/workspaces (workspace, membership, invitation, slug, personal)
- [ ] @lifeos/permissions (capabilities, resolver)
- [ ] @lifeos/pages (page.service, tree, slug)

## D. API Routes
- [ ] /api/v1/auth/* (register, login, logout, magic-link, password-reset, verify-email)
- [ ] /api/v1/me
- [ ] /api/v1/workspaces (+ [id], members, invitations)
- [ ] /api/v1/invitations/[token]/(accept|decline)
- [ ] /api/v1/pages (+ [id], move, archive)

## E. Cross-cutting
- [ ] withWorkspaceContext used on every tenant query
- [ ] No raw SQL outside packages/db or services
- [ ] No SELECT * anywhere
- [ ] AppError used for every failure path
- [ ] CSRF guard on every mutating /api/v1/* route
- [ ] Idempotency-Key required on every POST mutating route

## F. Tests
- [ ] capabilities.test.ts
- [ ] resolver.test.ts
- [ ] tree-cycle.test.ts
- [ ] recompute-depth.test.ts
- [ ] last-owner.test.ts
- [ ] transfer-ownership-atomicity.test.ts
- [ ] invitation-generic-error.test.ts
- [ ] session-lifecycle.test.ts
- [ ] password-hash.test.ts
- [ ] workspace-context.test.ts
- [ ] pgTAP RLS isolation
- [ ] E2E auth flow
- [ ] E2E workspace isolation
- [ ] E2E page tree

## G. Docs & ADRs
- [ ] ADR 0005 session storage
- [ ] ADR 0006 RLS context strategy
- [ ] ADR 0007 page tree depth strategy
- [ ] ADR 0008 invitation generic error
- [ ] ADR 0009 transfer ownership atomicity
- [ ] phase-02-checklist.md filled
- [ ] phase-02-decisions-log.md filled (≥ 8 decisions)
- [ ] phase-02-outputs.md filled
- [ ] rollback.md → Phase 02 section appended

## H. Lock
- [ ] git commit -m "phase-02: kernel — auth + workspaces + pages + RLS"
- [ ] git tag -a phase-02-locked
- [ ] git push origin phase/02-kernel
- [ ] git push origin phase-02-locked
```

### Step 32 — `docs/execution/phase-02-decisions-log.md` (محتوى أوّلي)

```markdown
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
```

### Step 33 — `docs/execution/phase-02-outputs.md` (Inter-phase Contract لـ Phase 03)

```markdown
# Phase 02 Outputs — Contract for Phase 03

## A. Files & Packages Delivered
- packages/auth, packages/auth-guard, packages/workspaces, packages/permissions, packages/pages
- packages/db/migrations/0100..0118 (idempotent + reversible)
- apps/web/src/app/api/v1/auth/**, /me, /workspaces/**, /invitations/**, /pages/**
- tests/pgtap/{0114, 0117}_*.sql
- docs/adr/0005..0009
- docs/execution/phase-02-{checklist,decisions-log,outputs}.md
- docs/runbooks/rollback.md (Phase 02 section appended)

## B. Git Artefacts
- Branch: phase/02-kernel
- Commit message: "phase-02: kernel — auth + workspaces + pages + RLS"
- Annotated tag: phase-02-locked

## C. Conventions Established (binding for Phase 03+)
- `withWorkspaceContext(db, { userId, workspaceId }, fn)` is the ONLY entry point for tenant data.
- Every tenant table MUST have ENABLE + FORCE RLS + an explicit policy using `app_is_member` or `app_current_workspace_id`.
- Every migration MUST include `-- ROLLBACK:` footer.
- Every mutating POST route MUST require `Idempotency-Key`.
- Every permission decision MUST go through `@lifeos/permissions/resolver.assertCapability`.
- Every invitation failure MUST be raised via a fresh `invitationGenericError()` call (factory function, not a shared singleton).
- AppError taxonomy now includes: AUTH_REQUIRED, AUTH_FORBIDDEN, AUTH_INVALID_CREDENTIALS, AUTH_EMAIL_TAKEN, AUTH_RATE_LIMITED, SESSION_EXPIRED, SESSION_INVALID, WORKSPACE_NOT_FOUND, WORKSPACE_LAST_OWNER, MEMBERSHIP_REQUIRED, INVITATION_INVALID, PAGE_NOT_FOUND, PAGE_INVALID_MOVE, PAGE_DEPTH_EXCEEDED.

## D. Environment Variables (REQUIRED for Phase 03)
All of these are added to `getServerEnv()` schema in `@lifeos/shared/server-env` (Phase 02 extends Phase 01 schema; see D-029):
- DATABASE_URL                          (from Phase 01)
- NODE_ENV                              (from Phase 01)
- APP_URL                               (NEW in Phase 02)
- SESSION_PEPPER                        (NEW in Phase 02, ≥ 32 chars, secret)
- SESSION_TTL_DAYS                      (NEW in Phase 02, default 30)
- SESSION_COOKIE_NAME                   (NEW in Phase 02, default lifeos_sid)
- MAGIC_LINK_TTL_MINUTES                (NEW in Phase 02, default 15)
- PASSWORD_RESET_TTL_MINUTES            (NEW in Phase 02, default 60)
- EMAIL_VERIFICATION_TTL_HOURS          (NEW in Phase 02, default 24)

## E. Migration Range
- Location: `packages/db/migrations/*.sql` (lives inside Phase 01's `packages/db/` package; this is the binding path for all future phases).
- Runner: `scripts/migrate.ts` tracks applied migrations in `schema_migrations` table.
- Used: 0100..0118
- Available for Phase 03: 0119..0199 (tasks, notes, habits, expenses, calendar, vault stubs, ai_usage)
- Phase 03 must continue ENABLE + FORCE RLS pattern for every new tenant table.

## F. Stubs Left for Later Phases
- oauth_accounts table only — full OAuth flow in Phase 04.
- email send is stub-console in dev; real provider in Phase 04 (or per owner input).
- CSRF double-submit cookie helper exists; UI wiring lives in Phase 05.
- vault encryption schema not yet — Phase 04 (`@noble/ciphers`).

## G. Open Risks / Known Limitations
- `recomputeDepthForSubtree` is O(N) per move; acceptable for trees ≤ 5k nodes. Optimize if profiles show > 200ms.
- `last_seen_at` write on every validateSession is an UPDATE-per-request — consider batching in Phase 06 (perf phase).
- `oauth_accounts.email_at_link` not unique on purpose; identity merge policy decided in Phase 04.

## H. Definition of Done Cross-check
- [x] All 19 migrations applied + reversible
- [x] All 5 packages green typecheck + lint + unit tests
- [x] All API routes envelope-compliant
- [x] pgTAP RLS isolation passing
- [x] E2E auth + isolation + page tree passing
- [x] CI green on phase/02-kernel
- [x] phase-02-locked tag pushed
- [x] phase-02-outputs.md committed
- [x] rollback.md Phase 02 section appended
```

### Step 34 — `docs/runbooks/rollback.md` (إضافة قسم Phase 02)

أضِف في نهاية الملف:

```markdown
## Phase 02 — Rollback Procedures

### 1) Tag revert
```

git checkout phase-01-locked

# OR for hot revert in production:

git revert <merge-sha-of-phase-02>

```

### 2) Migration down (per file, in reverse order 0118 → 0100)
Each migration's `-- ROLLBACK:` footer is the authoritative down script. Apply in strict reverse order:
```

pnpm db:rollback --to 0099

```

### 3) Session invalidation (if Phase 02 leaked secret)
```

UPDATE sessions SET revoked_at = now() WHERE revoked_at IS NULL;

```
Then rotate `SESSION_PEPPER` in the secrets manager and redeploy.

### 4) RLS emergency disable (last resort, requires owner approval)
```

ALTER TABLE pages DISABLE ROW LEVEL SECURITY;

-- ... per table

```
Log the override in `decisions-log.md` under D-OVERRIDE-<date>.
```

### Step 35 — Lock & Push

```bash
# 1) Final verification
pnpm typecheck && pnpm lint --max-warnings 0 && pnpm test && pnpm test:pgtap && pnpm test:e2e

# 2) Verify Phase 02 outputs contract file is present
test -f docs/execution/phase-02-outputs.md || { echo "BLOCKED: outputs file missing"; exit 1; }

# 3) Commit
git add .
git commit -m "phase-02: kernel — auth + workspaces + pages + RLS"

# 4) Annotated tag (unified convention)
git tag -a phase-02-locked -m "Phase 02 locked: identity + workspaces + memberships + invitations + pages tree + RLS (0100..0118), 5 packages, 4 ADRs, pgTAP + E2E green"

# 5) Push
git push origin phase/02-kernel
git push origin phase-02-locked

# 6) Sanity
git tag --list | grep -x phase-02-locked
```

## 5. تحذيرات (DO NOT)

- ❌ لا تبني editor blocks أو dashboards (Phase 03+).
- ❌ لا تستخدم AI أو billing logic (Phase 04/07+).
- ❌ لا تأخذ `workspaceId` من client بدون `requireWorkspace`.
- ❌ لا تكرر permission logic خارج `resolver.ts`.
- ❌ لا تكشف email/workspace في invitation errors.
- ❌ لا تسمح cycles في page tree.
- ❌ لا تكتب migration بدون `-- ROLLBACK:` footer.
- ❌ لا تستخدم `SELECT *` في أي repo.
- ❌ لا تخزّن raw session tokens — فقط `token_hash` (HMAC).
- ❌ لا تستخدم `===` على HMAC/secret comparisons — استخدم `safeEqual` / `timingSafeEqual`.
- ❌ لا تكتب `process.env` خارج `@lifeos/shared/server-env`.
- ❌ لا تستخدم `new Date()` في business logic — استخدم `clock.now()` (استثناءات: `clock.ts` و `logger.ts` فقط، من Phase 01).
- ❌ لا تنفّذ query على tenant table خارج `withWorkspaceContext`.

## 6. Definition of Done (Phase 02)

Phase 02 جاهز عندما:

- ✅ كل 19 migration مطبَّقة + reversible + idempotent.
- ✅ كل 5 packages تمر typecheck + lint + unit tests.
- ✅ كل tenant table عليها RLS + FORCE + policy واضحة.
- ✅ `withWorkspaceContext` هو نقطة الدخول الوحيدة لكل query.
- ✅ `resolver.assertCapability` هو نقطة القرار الوحيدة للصلاحيات.
- ✅ كل invitation error يخرج بـ `invitationGenericError()` (factory function, not singleton).
- ✅ كل mutating POST يفرض `Idempotency-Key`.
- ✅ pgTAP RLS isolation suite ناجح.
- ✅ E2E (auth + isolation + page-tree) ناجحة.
- ✅ ADR 0005..0008 مكتوبة.
- ✅ `docs/execution/phase-02-checklist.md` ملآنة.
- ✅ `docs/execution/phase-02-decisions-log.md` فيها ≥ 8 قرارات.
- ✅ `docs/execution/phase-02-outputs.md` مكتوبة بالكامل (Inter-phase contract).
- ✅ `docs/runbooks/rollback.md` فيها قسم Phase 02.
- ✅ git tag `phase-02-locked` annotated ومدفوع.
- ✅ CI أخضر على branch `phase/02-kernel`.

## 7. الانتقال لـ Phase 03

بعد قفل `phase-02-locked` و push الـ `phase-02-outputs.md`:

- Phase 03 (Domain Schemas: tasks/notes/habits/expenses/calendar/vault/ai_usage) يبدأ من range 0119..0199.
- Phase 03 ستستهلك `withWorkspaceContext` كما هو — ممنوع إنشاء نسخة بديلة.
- Phase 03 ستضيف ADRs 0009+ ولا تعدّل ADRs 0001..0008.
- Phase 03 ستستمر بنفس convention: `phase/03-domain-schemas` + `phase-03-locked`.