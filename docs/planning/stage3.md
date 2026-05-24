# Phase 03 — Domain Schemas & Data Plane

<aside>
📦

**هدف المرحلة:** بناء طبقة البيانات الأساسية (Domain Schemas) للنطاقات السبعة: tasks / notes / habits / expenses / calendar / vault metadata / ai_usage + الـ baselines (xp_events / daily_reviews / import_jobs / public_shares / webhook_nonces / audit & rate-limit extensions / outbound_emails). كل جدول يلزمه: migration + RLS + FORCE RLS + policy + indexes + repo + service + audit event + pgTAP test + Vitest test. ممنوع UI، ممنوع AI prompts فعلية، ممنوع Vault plaintext، ممنوع Stripe/Billing.

</aside>

## Metadata

- **Branch:** `phase/03-domain-schemas`
- **Tag على Done:** `phase-03-locked` (annotated)
- **Migrations range:** `0119..0199` (binding من Phase 02)
- **Outputs file:** `docs/execution/phase-03-outputs.md`
- **Depends on:** Phase 02 outputs (`docs/execution/phase-02-outputs.md`, tag `phase-02-locked`)
- **Consumed by:** Phase 04 (Security & Vault Crypto), Phase 05 (UI)

## 1. ملخص المرحلة

Wave 03 تضيف الـ Domain Data Plane التي ستستخدمها مراحل UI/AI/Automations:

- **النطاقات الأساسية (7):** tasks, notes (+versions), habits (+checkins), expenses (+budgets), calendar_events, vault_items metadata (المحتوى المشفَّر في Phase 04), ai_usage (+events + RPCs).
- **الـ baselines (8):** xp_events, daily_reviews, import_jobs, public_shares, webhook_nonces, audit_logs extensions, rate_limit_buckets extensions, outbound_emails.
- **AI Quota Engine:** race-free reservation/completion/refund عبر SQL functions تعتمد على `FOR UPDATE` على workspace row + idempotency.
- **Repositories pattern:** `BaseRepo` يُجبر أعمدة صريحة (ممنوع `SELECT *`)، كل repo يُنفِّذ `mapRow`، كل service يدخل عبر `withWorkspaceContext` (من Phase 02).
- **AppError taxonomy** تُمدَّد لكن لا تُعرَّف من جديد — تُستورَد من `@lifeos/shared/errors` (Phase 01).

## 2. عقد الدخول (من Phase 02)

قبل البدء، تحقَّق صراحةً من توفر هذه المخرجات (من `docs/execution/phase-02-outputs.md`):

- [ ]  tag `phase-02-locked` موجود.
- [ ]  `withWorkspaceContext` يعمل ويُحدِّد `SET LOCAL app.current_workspace_id`.
- [ ]  `withWorkspaceRoute` implementation حقيقية (لا placeholder).
- [ ]  `assertCapability(actor, capability)` متاح كنقطة قرار الصلاحيات الوحيدة.
- [ ]  `invitationGenericError()` factory متاح.
- [ ]  `ServerEnv` يحتوي: `DATABASE_URL`, `NODE_ENV`, `APP_URL`, `SESSION_PEPPER`, `SESSION_TTL_DAYS`, `SESSION_COOKIE_NAME`, `MAGIC_LINK_TTL_MINUTES`, `PASSWORD_RESET_TTL_MINUTES`, `EMAIL_VERIFICATION_TTL_HOURS`.
- [ ]  `AppError` 2-arg signature `(code, message?, metadata?)` + `STATUS_MAP` متاح.
- [ ]  `scripts/migrate.ts` runner + `schema_migrations` table يعملان.
- [ ]  جداول Phase 02 موجودة: `users`, `sessions`, `workspaces`, `workspace_memberships`, `invitations`, `pages`, `audit_logs` baseline, `rate_limit_buckets` baseline.
- [ ]  RLS + FORCE RLS مُفعَّل على كل tenant tables السابقة.
- [ ]  CI أخضر على `phase-02-locked`.

### عقد إضافي إلزامي

أي خرق لهذا العقد يجب أن يُرفَع كـ blocker في Phase 02 أولاً (لا تُصلَح هنا):

- ممنوع تعريف `AppError` ثانيًا في Phase 03.
- ممنوع تعديل `withWorkspaceContext` أو `validateSession` هنا.
- ممنوع SQL داخل route handlers.
- ممنوع `SELECT *` في أي repo.
- **Phase 03 يضيف صراحةً** `packages/repo` للـ workspace (لم يكن في Phase 01/02) — راجع Step 3.1.
- **Phase 03 يضيف صراحةً** `Actor` type في `@lifeos/permissions` (إن لم يكن موجودًا) — راجع Step 2.5.

## 3. عقد الخروج (لـ Phase 04 و05)

عند اكتمال Phase 03 (`phase-03-locked`) يجب أن يكون متاحًا للمراحل التالية:

- 7 services جاهزة (`TaskService`, `NoteService`, `HabitService`, `ExpenseService`, `CalendarService`, `VaultMetaService`, `AiQuotaService`) — جميعها workspace-scoped عبر `withWorkspaceContext`.
- AI Quota RPCs: `reserve_ai_usage`, `complete_ai_usage`, `refund_ai_usage` (race-free + idempotent).
- جداول baseline جاهزة: `xp_events`, `daily_reviews`, `import_jobs`, `public_shares`, `webhook_nonces`.
- AppError codes جديدة مُسجَّلة (في `@lifeos/shared/errors`): `TASK_NOT_FOUND`, `NOTE_NOT_FOUND`, `NOTE_VERSION_CONFLICT`, `HABIT_NOT_FOUND`, `HABIT_CHECKIN_DUPLICATE`, `EXPENSE_NOT_FOUND`, `BUDGET_EXCEEDED`, `CALENDAR_EVENT_NOT_FOUND`, `CALENDAR_TIME_INVALID`, `VAULT_ITEM_NOT_FOUND`, `AI_QUOTA_EXCEEDED`, `AI_USAGE_NOT_RESERVED`, `AI_USAGE_NOT_REFUNDABLE`, `IMPORT_JOB_NOT_FOUND`, `PUBLIC_SHARE_NOT_FOUND`, `PUBLIC_SHARE_EXPIRED`, `WEBHOOK_NONCE_REUSED`.
- `docs/execution/phase-03-outputs.md` يوثِّق: الجداول، الأعمدة الحسّاسة (money / pii / encrypted)، حدود الـ AI quota الافتراضية، runbook الـ rollback.
- آخر migration applied يُسجَّل في `schema_migrations` بـ `phase=03`.

## 4. خريطة الملفات النهائية

```
packages/
├── shared/src/errors/codes.ts                  # ← تُمدَّد فقط (لا تُعرَّف من جديد)
├── db/migrations/0119__profiles_extensions.sql
├── db/migrations/0120__tasks.sql
├── db/migrations/0121__tasks_indexes.sql
├── db/migrations/0122__tasks_rls.sql
├── db/migrations/0123__notes.sql
├── db/migrations/0124__note_versions.sql
├── db/migrations/0125__notes_rls.sql
├── db/migrations/0126__habits.sql
├── db/migrations/0127__habit_checkins.sql
├── db/migrations/0128__habits_rls.sql
├── db/migrations/0129__expenses.sql
├── db/migrations/0130__budgets.sql
├── db/migrations/0131__expenses_rls.sql
├── db/migrations/0132__calendar_events.sql
├── db/migrations/0133__calendar_rls.sql
├── db/migrations/0134__vault_items_metadata.sql
├── db/migrations/0135__vault_rls.sql
├── db/migrations/0136__ai_usage_events.sql
├── db/migrations/0137__ai_usage_indexes.sql
├── db/migrations/0138__ai_usage_rls.sql
├── db/migrations/0139__ai_usage_rpcs.sql
├── db/migrations/0140__xp_events.sql
├── db/migrations/0141__daily_reviews.sql
├── db/migrations/0142__import_jobs.sql
├── db/migrations/0143__public_shares.sql
├── db/migrations/0144__webhook_nonces.sql
├── db/migrations/0145__audit_logs_extensions.sql
├── db/migrations/0146__rate_limit_buckets_extensions.sql
├── db/migrations/0147__outbound_emails.sql
├── repo/package.json                            # ← V1.1 (إجباري)
├── repo/tsconfig.json                           # ← V1.1 (إجباري)
├── repo/src/base-repo.ts                        # ← يُنشَأ هنا (Phase 01/02 لم يُنشئوه)
├── repo/src/pagination.ts
├── repo/src/index.ts
├── permissions/src/actor.ts                     # ← V1.1 (تعريف Actor type)
├── services/src/tasks/{task.repo.ts,task.service.ts,task.types.ts,index.ts}
├── services/src/notes/{note.repo.ts,note.service.ts,note.types.ts,index.ts}
├── services/src/habits/{habit.repo.ts,habit.service.ts,habit.types.ts,index.ts}
├── services/src/expenses/{expense.repo.ts,budget.repo.ts,expense.service.ts,expense.types.ts,index.ts}
├── services/src/calendar/{calendar.repo.ts,calendar.service.ts,calendar.types.ts,index.ts}
├── services/src/vault/{vault-meta.repo.ts,vault-meta.service.ts,vault.types.ts,index.ts}
├── services/src/ai/{ai-quota.repo.ts,ai-quota.service.ts,ai.types.ts,index.ts}
├── services/src/xp/{xp.repo.ts,xp.service.ts,index.ts}
├── services/src/reviews/{daily-review.repo.ts,daily-review.service.ts,index.ts}
├── services/src/imports/{import-job.repo.ts,import-job.service.ts,index.ts}
├── services/src/shares/{public-share.repo.ts,public-share.service.ts,index.ts}
├── services/src/webhooks/{webhook-nonce.repo.ts,webhook-nonce.service.ts,index.ts}
└── tests/
    ├── pgtap/0120_tasks_rls.sql
    ├── pgtap/0123_notes_rls.sql
    ├── pgtap/0126_habits_rls.sql
    ├── pgtap/0129_expenses_rls.sql
    ├── pgtap/0132_calendar_rls.sql
    ├── pgtap/0134_vault_rls.sql
    ├── pgtap/0136_ai_usage_rls.sql
    ├── unit/ai-quota-race.test.ts
    ├── unit/ai-quota-idempotency.test.ts
    ├── unit/ai-quota-refund.test.ts
    ├── unit/expenses-money.test.ts
    ├── unit/note-version-conflict.test.ts
    ├── unit/habit-checkin-duplicate.test.ts
    ├── unit/calendar-time-validation.test.ts
    ├── pgtap/_setup.sql                         # V1.1 (_test_seed_row helper)
    └── integration/repos-no-select-star.test.ts

docs/
├── adr/
│   ├── 0010-money-storage-bigint-cents.md
│   ├── 0011-ai-quota-race-free-rpc.md
│   ├── 0012-note-version-optimistic-concurrency.md
│   ├── 0013-vault-metadata-vs-crypto-separation.md
│   ├── 0014-base-repo-no-select-star.md
│   ├── 0015-actor-type-in-permissions.md           # V1.1
│   ├── 0016-workspace-monthly-ai-token-limit.md    # V1.1
│   └── 0017-expense-budget-check-transactional.md  # V1.1
├── execution/phase-03-outputs.md
└── runbooks/rollback-phase-03.md
```

## 5. ADRs الجديدة (8 إجمالًا — 0010..0017)

### ADR 0010 — Money Storage: BIGINT cents only

- **القرار:** كل الحقول المالية تُخزَّن كـ `BIGINT` بالـ cents (أصغر وحدة عملة). كل عملة لها عمود `currency CHAR(3)` بجانبها.
- **ممنوع:** `NUMERIC`, `DECIMAL`, `FLOAT`, `REAL`, `DOUBLE PRECISION` لأي حقل مالي.
- **السبب:** floats غير دقيقة، NUMERIC أبطأ، BIGINT cents هو القاعدة الصناعية (Stripe / Shopify).
- **القاعدة:** `expenses.amount_cents`, `budgets.monthly_limit_cents`, إلخ. التحويل للعرض في الـ UI فقط.

### ADR 0011 — AI Quota: Race-Free via SQL RPC + FOR UPDATE

- **القرار:** كل عمليات الحجز/الإكمال/الاسترداد للـ AI quota تمر عبر SQL functions (`reserve_ai_usage`, `complete_ai_usage`, `refund_ai_usage`) تستخدم `SELECT ... FOR UPDATE` على `workspaces` row.
- **ممنوع:** حساب الحصة المتبقية في TypeScript ثم INSERT — race condition مؤكدة.
- **idempotency:** كل reservation لها `idempotency_key` فريد على مستوى الـ workspace (`UNIQUE(workspace_id, idempotency_key)`).

### ADR 0012 — Note Versions: Optimistic Concurrency via `version` column

- **القرار:** `notes.version INTEGER` يبدأ بـ 1 ويُزاد بـ +1 في كل UPDATE. الـ UPDATE يفشل لو الـ version المُرسَل لا يطابق الحالي → `NOTE_VERSION_CONFLICT`.
- **`note_versions`:** snapshot لكل تعديل (immutable, append-only).
- **ممنوع:** SELECT-then-UPDATE بدون version check.

### ADR 0013 — Vault: Metadata هنا، Crypto في Phase 04

- **القرار:** Phase 03 يُنشئ فقط `vault_items` metadata (id, workspace_id, user_id, title_hash, item_type, created_at). الحقول المشفَّرة (`encrypted_blob`, `nonce`, `wrapped_key`) تُضاف في Phase 04.
- **السبب:** فصل الـ schema عن الـ crypto يسمح بـ migrations مستقلة + audit أوضح.
- **ممنوع:** تخزين أي plaintext في `vault_items` (حتى `title`).

### ADR 0014 — BaseRepo: explicit columns, no SELECT *

- **القرار:** `BaseRepo<TEntity, TRow>` abstract يجبر كل subclass على تعريف `columns: readonly string[]` + `mapRow(row)`. كل SQL يستخدم `selectList()` بدلًا من `*`.
- **`softDelete: boolean` flag** (default `true`) — الجداول append-only (note_versions / habit_checkins / xp_events / daily_reviews / webhook_nonces) تجعله `false` لإلغاء `AND is_deleted = false` filter.
- **السبب:** يحمي من schema drift، يُسرِّع الـ queries، يُنبِّه عند إضافة عمود حسّاس (PII/encrypted) بالخطأ.
- **CI check:** lint rule + grep يبحث عن `SELECT *` ويفشل البناء.

### ADR 0015 — `Actor` Type Lives in `@lifeos/permissions`

- **القرار:** `Actor` type (userId, workspaceId, role, capabilities?) يُعرَّف واحدًا في `packages/permissions/src/actor.ts` ويُصدَّر مع `assertCapability`.
- **ممنوع:** استيراد `Actor` من `@lifeos/auth` (غير موجود هناك) أو إعادة تعريفه في أي service.
- **السبب:** `assertCapability` تعيش في `@lifeos/permissions` (Phase 02) — `Actor` تتبعها دلاليًا.

### ADR 0016 — `monthly_ai_token_limit` on `workspaces`

- **القرار:** الحد الشهري للـ AI tokens يُخزّن كعمود `BIGINT NOT NULL DEFAULT 100000` على `workspaces` (تُضاف في 0119).
- **ممنوع:** تمرير `monthlyLimit` من الـ application إلى `reserve_ai_usage` — يمكن التلاعب به عبر client.
- **السبب:** الحد جزء من حالة الـ workspace — تغييره audit event + admin-only.

### ADR 0017 — Expense Budget Check: Transactional `FOR UPDATE`

- **القرار:** فحص البودجت وإدخال الـ expense يتمّان داخل `db.tx()` واحد مع `SELECT ... FROM budgets ... FOR UPDATE`.
- **ممنوع:** SELECT-then-INSERT خارج transaction (race condition: طلبان متوازيان يتجاوزان الحد).
- **السبب:** نفس نمط AI quota (ADR 0011) — atomic check+write.

## 6. ترتيب التنفيذ الإجباري

### Step 1 — Preflight

اكتب `docs/preflight-phase-03.md`:

```markdown
# Phase 03 Preflight

## Required Tags
- phase-02-locked: yes/no

## Required Phase 02 Outputs
- withWorkspaceContext working: yes/no
- withWorkspaceRoute real implementation: yes/no
- assertCapability (from @lifeos/permissions) available: yes/no
- AppError 2-arg signature: yes/no
- scripts/migrate.ts working: yes/no
- ServerEnv extended (SESSION_*, APP_URL): yes/no

## Required Inputs
- DATABASE_URL: provided/not provided
- AI provider key: mock/live (live optional في Phase 03)

## Checks
- typecheck: pass/fail
- lint: pass/fail
- existing pgTAP tests: pass/fail
- existing unit tests: pass/fail
```

### Step 2 — افتح branch + extend AppError codes

```bash
git checkout -b phase/03-domain-schemas
git tag --list | grep phase-02-locked   # must exist
pnpm install --frozen-lockfile
pnpm typecheck && pnpm lint --max-warnings 0 && pnpm test
```

أضف codes جديدة في `packages/shared/src/errors/codes.ts` عبر **TypeScript declaration merging** (تمديد union فعليًا، ليس const object):

```tsx
// File: packages/shared/src/errors/codes.ts (Phase 03 extension)
// Phase 03 extends the ErrorCode union via interface registry pattern.
// Phase 01 must define:
//   export interface ErrorCodeRegistry {}
//   export type ErrorCode = keyof ErrorCodeRegistry | (string & { readonly __brand?: 'ErrorCode' });
// then each phase augments ErrorCodeRegistry.

declare module '@lifeos/shared/errors' {
	interface ErrorCodeRegistry {
		// Tasks
		TASK_NOT_FOUND: true;
		// Notes
		NOTE_NOT_FOUND: true;
		NOTE_VERSION_CONFLICT: true;
		// Habits
		HABIT_NOT_FOUND: true;
		HABIT_CHECKIN_DUPLICATE: true;
		// Expenses
		EXPENSE_NOT_FOUND: true;
		EXPENSE_AMOUNT_INVALID: true;
		BUDGET_EXCEEDED: true;
		// Calendar
		CALENDAR_EVENT_NOT_FOUND: true;
		CALENDAR_TIME_INVALID: true;
		// Vault metadata
		VAULT_ITEM_NOT_FOUND: true;
		// AI quota
		AI_QUOTA_EXCEEDED: true;
		AI_USAGE_NOT_RESERVED: true;
		AI_USAGE_NOT_REFUNDABLE: true;
		WORKSPACE_NOT_FOUND: true;
		// Imports / Shares / Webhooks
		IMPORT_JOB_NOT_FOUND: true;
		PUBLIC_SHARE_NOT_FOUND: true;
		PUBLIC_SHARE_EXPIRED: true;
		WEBHOOK_NONCE_REUSED: true;
	}
}

// Runtime registry — used by STATUS_MAP and audit code
export const PHASE_03_ERROR_CODES = [
	'TASK_NOT_FOUND',
	'NOTE_NOT_FOUND','NOTE_VERSION_CONFLICT',
	'HABIT_NOT_FOUND','HABIT_CHECKIN_DUPLICATE',
	'EXPENSE_NOT_FOUND','EXPENSE_AMOUNT_INVALID','BUDGET_EXCEEDED',
	'CALENDAR_EVENT_NOT_FOUND','CALENDAR_TIME_INVALID',
	'VAULT_ITEM_NOT_FOUND',
	'AI_QUOTA_EXCEEDED','AI_USAGE_NOT_RESERVED','AI_USAGE_NOT_REFUNDABLE','WORKSPACE_NOT_FOUND',
	'IMPORT_JOB_NOT_FOUND','PUBLIC_SHARE_NOT_FOUND','PUBLIC_SHARE_EXPIRED','WEBHOOK_NONCE_REUSED',
] as const satisfies ReadonlyArray<keyof import('@lifeos/shared/errors').ErrorCodeRegistry>;

export type Phase03ErrorCode = (typeof PHASE_03_ERROR_CODES)[number];
```

**Step 2.5 — تعريف `Actor` type في `@lifeos/permissions` (إن لم يكن موجودًا من Phase 02):**

```tsx
// File: packages/permissions/src/actor.ts
export type Actor = {
	readonly userId: string;
	readonly workspaceId: string;
	readonly role: 'owner' | 'admin' | 'member' | 'guest';
	readonly capabilities?: ReadonlyArray<string>;
};

// File: packages/permissions/src/index.ts (re-export)
export type { Actor } from './actor';
export { assertCapability } from './resolver';
```

مدِّد `STATUS_MAP` (في نفس الملف من Phase 01) — كل الأكواد أعلاه افتراضيًا 404 ما عدا:

- `NOTE_VERSION_CONFLICT` → 409
- `HABIT_CHECKIN_DUPLICATE` → 409
- `EXPENSE_AMOUNT_INVALID` → 400
- `BUDGET_EXCEEDED` → 422
- `CALENDAR_TIME_INVALID` → 400
- `AI_QUOTA_EXCEEDED` → 429
- `AI_USAGE_NOT_RESERVED` → 409
- `AI_USAGE_NOT_REFUNDABLE` → 409
- `WORKSPACE_NOT_FOUND` → 404
- `PUBLIC_SHARE_EXPIRED` → 410
- `WEBHOOK_NONCE_REUSED` → 409

### Step 3 — Add `packages/repo` to workspace + BaseRepo

**3.1 — تسجيل الـ package في الـ workspace:**

تأكد أن `pnpm-workspace.yaml` (root) يحوي:

```yaml
packages:
	- 'apps/*'
	- 'packages/*'
```

أنشئ `packages/repo/package.json`:

```json
{
	"name": "@lifeos/repo",
	"version": "0.0.0",
	"private": true,
	"main": "./src/index.ts",
	"types": "./src/index.ts",
	"dependencies": {
		"@lifeos/db": "workspace:*",
		"@lifeos/shared": "workspace:*"
	},
	"devDependencies": {
		"typescript": "^5.4.0"
	}
}
```

أنشئ `packages/repo/tsconfig.json`:

```json
{
	"extends": "../../tsconfig.base.json",
	"compilerOptions": { "rootDir": "src", "outDir": "dist", "composite": true },
	"include": ["src/**/*"],
	"references": [
		{ "path": "../db" },
		{ "path": "../shared" }
	]
}
```

أضف reference في root `tsconfig.json`:

```json
{ "references": [
	{ "path": "packages/shared" },
	{ "path": "packages/db" },
	{ "path": "packages/permissions" },
	{ "path": "packages/repo" },
	{ "path": "packages/services" }
] }
```

ثم: `pnpm install` و `pnpm typecheck` (لازم ينجح قبل المتابعة).

**3.2 — `packages/repo/src/base-repo.ts`:**

```tsx
import type { DbClient } from '@lifeos/db';

export abstract class BaseRepo<TEntity, TRow = TEntity> {
	protected abstract readonly table: string;
	protected abstract readonly columns: readonly string[];
	/**
	 * Set to false in subclasses for append-only or non-soft-delete tables
	 * (note_versions, habit_checkins, xp_events, daily_reviews, webhook_nonces).
	 * Default is true (assumes is_deleted boolean column exists).
	 */
	protected readonly softDelete: boolean = true;
	protected abstract mapRow(row: TRow): TEntity;

	constructor(protected readonly db: DbClient) {}

	protected selectList(): string {
		if (this.columns.length === 0) {
			throw new Error(`REPO_EMPTY_COLUMNS: ${this.table}`);
		}
		if (this.columns.some((c) => c === '*' || c.includes('*'))) {
			throw new Error(`REPO_WILDCARD_FORBIDDEN: ${this.table}`);
		}
		return this.columns.join(', ');
	}

	protected deletedFilter(): string {
		return this.softDelete ? 'AND is_deleted = false' : '';
	}

	async findById(id: string, workspaceId: string): Promise<TEntity | null> {
		const row = await this.db.oneOrNone<TRow>(
			`SELECT ${this.selectList()} FROM ${this.table} WHERE id = $1 AND workspace_id = $2 ${this.deletedFilter()}`,
			[id, workspaceId],
		);
		return row ? this.mapRow(row) : null;
	}

	async listByWorkspace(
		workspaceId: string,
		opts: { limit?: number; cursor?: string | null } = {},
	): Promise<{ items: TEntity[]; nextCursor: string | null }> {
		const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
		const rows = await this.db.many<TRow>(
			`SELECT ${this.selectList()} FROM ${this.table}
			  WHERE workspace_id = $1 ${this.deletedFilter()}
			    AND ($2::text IS NULL OR id > $2)
			  ORDER BY id ASC LIMIT $3`,
			[workspaceId, opts.cursor ?? null, limit + 1],
		);
		const items = rows.slice(0, limit).map((r) => this.mapRow(r));
		const nextCursor = rows.length > limit ? (rows[limit - 1] as unknown as { id: string }).id : null;
		return { items, nextCursor };
	}
}
```

**3.3 — Repos غير soft-delete (override):**

```tsx
export class NoteVersionRepo extends BaseRepo<NoteVersion, NoteVersionRow> {
	protected readonly table = 'note_versions';
	protected readonly softDelete = false; // append-only
	// ...
}
// Same for HabitCheckinRepo, XpEventRepo, DailyReviewRepo, WebhookNonceRepo.
```

### Step 4 — Migration 0119: profiles extensions

`packages/db/migrations/0119__profiles_extensions.sql`:

```sql
-- File: 0119__profiles_extensions.sql
-- Phase: 03
-- Description: Profile fields needed by domain services (timezone, locale).
-- Idempotent: YES
BEGIN;

ALTER TABLE users
	ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC',
	ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en-US',
	ADD COLUMN IF NOT EXISTS display_name TEXT;

-- AI quota limit lives on the workspace row (not application-controlled)
ALTER TABLE workspaces
	ADD COLUMN IF NOT EXISTS monthly_ai_token_limit BIGINT NOT NULL DEFAULT 100000
		CHECK (monthly_ai_token_limit > 0);

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- ALTER TABLE workspaces DROP COLUMN IF EXISTS monthly_ai_token_limit;
-- ALTER TABLE users DROP COLUMN IF EXISTS display_name;
-- ALTER TABLE users DROP COLUMN IF EXISTS locale;
-- ALTER TABLE users DROP COLUMN IF EXISTS timezone;
-- COMMIT;
```

### Step 5 — Tasks (0120..0122)

`0120__tasks.sql`:

```sql
-- File: 0120__tasks.sql
-- Phase: 03
-- Description: Tasks domain table.
-- Idempotent: YES
BEGIN;

CREATE TABLE IF NOT EXISTS tasks (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	created_by TEXT NOT NULL REFERENCES users(id),
	title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
	description TEXT,
	status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done','cancelled')),
	priority SMALLINT NOT NULL DEFAULT 2 CHECK (priority BETWEEN 0 AND 3),
	due_at TIMESTAMPTZ,
	completed_at TIMESTAMPTZ,
	parent_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
	is_deleted BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS tasks CASCADE;
-- COMMIT;
```

`0121__tasks_indexes.sql`:

```sql
BEGIN;
CREATE INDEX IF NOT EXISTS idx_tasks_ws_status ON tasks(workspace_id, status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_tasks_ws_due ON tasks(workspace_id, due_at) WHERE is_deleted = false AND due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id) WHERE parent_id IS NOT NULL;
COMMIT;
```

`0122__tasks_rls.sql`:

```sql
BEGIN;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;

CREATE POLICY tasks_isolation ON tasks
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;
```

`packages/services/src/tasks/task.repo.ts`:

```tsx
import { BaseRepo } from '@lifeos/repo';
import { newUlid } from '@lifeos/shared';
import type { DbClient } from '@lifeos/db';

type TaskRow = {
	id: string;
	workspace_id: string;
	created_by: string;
	title: string;
	description: string | null;
	status: 'todo' | 'in_progress' | 'done' | 'cancelled';
	priority: number;
	due_at: Date | null;
	completed_at: Date | null;
	parent_id: string | null;
	created_at: Date;
	updated_at: Date;
};

export type Task = {
	id: string;
	workspaceId: string;
	createdBy: string;
	title: string;
	description: string | null;
	status: TaskRow['status'];
	priority: number;
	dueAt: Date | null;
	completedAt: Date | null;
	parentId: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export class TaskRepo extends BaseRepo<Task, TaskRow> {
	protected readonly table = 'tasks';
	protected readonly columns = [
		'id','workspace_id','created_by','title','description','status','priority',
		'due_at','completed_at','parent_id','created_at','updated_at',
	] as const;

	protected mapRow(r: TaskRow): Task {
		return {
			id: r.id, workspaceId: r.workspace_id, createdBy: r.created_by,
			title: r.title, description: r.description, status: r.status,
			priority: r.priority, dueAt: r.due_at, completedAt: r.completed_at,
			parentId: r.parent_id, createdAt: r.created_at, updatedAt: r.updated_at,
		};
	}

	async create(input: { workspaceId: string; createdBy: string; title: string; description?: string; priority?: number; dueAt?: Date | null; parentId?: string | null; }): Promise<Task> {
		const id = newUlid();
		const row = await this.db.one<TaskRow>(
			`INSERT INTO tasks (id, workspace_id, created_by, title, description, priority, due_at, parent_id)
			 VALUES ($1,$2,$3,$4,$5,COALESCE($6,2),$7,$8)
			 RETURNING ${this.selectList()}`,
			[id, input.workspaceId, input.createdBy, input.title, input.description ?? null, input.priority ?? null, input.dueAt ?? null, input.parentId ?? null],
		);
		return this.mapRow(row);
	}

	async updateStatus(id: string, workspaceId: string, status: TaskRow['status']): Promise<Task | null> {
		// Phase 03 V1.1: SQL now() replaces new Date(); toggle via boolean param.
		const setCompletedAt = status === 'done';
		const row = await this.db.oneOrNone<TaskRow>(
			`UPDATE tasks SET status = $3, completed_at = CASE WHEN $4::boolean THEN now() ELSE NULL END, updated_at = now()
			  WHERE id = $1 AND workspace_id = $2 AND is_deleted = false
			  RETURNING ${this.selectList()}`,
			[id, workspaceId, status, setCompletedAt],
		);
		return row ? this.mapRow(row) : null;
	}

	async softDelete(id: string, workspaceId: string): Promise<boolean> {
		// Phase 03 V1.1: DbClient has no result() — use oneOrNone(... RETURNING id).
		const row = await this.db.oneOrNone<{ id: string }>(
			`UPDATE tasks SET is_deleted = true, updated_at = now() WHERE id = $1 AND workspace_id = $2 AND is_deleted = false RETURNING id`,
			[id, workspaceId],
		);
		return row !== null;
	}
}
```

`packages/services/src/tasks/task.service.ts`:

```tsx
import { AppError } from '@lifeos/shared';
import { assertCapability, type Actor } from '@lifeos/permissions';
import { TaskRepo, type Task } from './task.repo';

export class TaskService {
	constructor(private readonly repo: TaskRepo) {}

	async create(actor: Actor, input: { title: string; description?: string; priority?: number; dueAt?: Date | null; parentId?: string | null; }): Promise<Task> {
		assertCapability(actor, 'task:create');
		return this.repo.create({ workspaceId: actor.workspaceId, createdBy: actor.userId, ...input });
	}

	async updateStatus(actor: Actor, id: string, status: Task['status']): Promise<Task> {
		assertCapability(actor, 'task:update');
		const result = await this.repo.updateStatus(id, actor.workspaceId, status);
		if (!result) throw new AppError('TASK_NOT_FOUND', 'Task not found.');
		return result;
	}

	async delete(actor: Actor, id: string): Promise<void> {
		assertCapability(actor, 'task:delete');
		const ok = await this.repo.softDelete(id, actor.workspaceId);
		if (!ok) throw new AppError('TASK_NOT_FOUND', 'Task not found.');
	}
}
```

### Step 6 — Notes + Versions (0123..0125)

`0123__notes.sql`:

```sql
BEGIN;
CREATE TABLE IF NOT EXISTS notes (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	created_by TEXT NOT NULL REFERENCES users(id),
	title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
	body_md TEXT NOT NULL DEFAULT '',
	version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
	is_deleted BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notes_ws_updated ON notes(workspace_id, updated_at DESC) WHERE is_deleted = false;
COMMIT;
```

`0124__note_versions.sql`:

```sql
BEGIN;
CREATE TABLE IF NOT EXISTS note_versions (
	id TEXT PRIMARY KEY,
	note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	version INTEGER NOT NULL CHECK (version >= 1),
	title TEXT NOT NULL,
	body_md TEXT NOT NULL,
	edited_by TEXT NOT NULL REFERENCES users(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT uq_note_version UNIQUE (note_id, version)
);
CREATE INDEX IF NOT EXISTS idx_note_versions_note ON note_versions(note_id, version DESC);
COMMIT;
```

`0125__notes_rls.sql`:

```sql
BEGIN;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes FORCE ROW LEVEL SECURITY;
CREATE POLICY notes_isolation ON notes
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));

ALTER TABLE note_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_versions FORCE ROW LEVEL SECURITY;
CREATE POLICY note_versions_isolation ON note_versions
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;
```

`packages/services/src/notes/note.repo.ts` (مختصر — أهم جزء: optimistic concurrency):

```tsx
import { BaseRepo } from '@lifeos/repo';
import { newUlid } from '@lifeos/shared';
import type { DbClient } from '@lifeos/db';

export type Note = {
	id: string;
	workspaceId: string;
	createdBy: string;  // Phase 03 V1.1: required for audit
	title: string;
	bodyMd: string;
	version: number;
	createdAt: Date;
	updatedAt: Date;
};

// NoteRow type defined explicitly.
type NoteRow = {
	id: string;
	workspace_id: string;
	created_by: string;
	title: string;
	body_md: string;
	version: number;
	created_at: Date;
	updated_at: Date;
};

export class NoteRepo extends BaseRepo<Note, NoteRow> {
	protected readonly table = 'notes';
	protected readonly columns = ['id','workspace_id','created_by','title','body_md','version','created_at','updated_at'] as const;
	protected mapRow(r: NoteRow): Note {
		return {
			id: r.id,
			workspaceId: r.workspace_id,
			createdBy: r.created_by,
			title: r.title,
			bodyMd: r.body_md,
			version: r.version,
			createdAt: r.created_at,
			updatedAt: r.updated_at,
		};
	}

	async updateWithVersion(id: string, workspaceId: string, expectedVersion: number, patch: { title?: string; bodyMd?: string }, editedBy: string): Promise<Note | 'CONFLICT' | null> {
		return this.db.tx(async (tx) => {
			const row = await tx.oneOrNone<NoteRow>(
				`UPDATE notes SET title = COALESCE($4, title), body_md = COALESCE($5, body_md), version = version + 1, updated_at = now()
				  WHERE id = $1 AND workspace_id = $2 AND version = $3 AND is_deleted = false
				  RETURNING ${this.selectList()}`,
				[id, workspaceId, expectedVersion, patch.title ?? null, patch.bodyMd ?? null],
			);
			if (!row) {
				const exists = await tx.oneOrNone<{ version: number }>(`SELECT version FROM notes WHERE id = $1 AND workspace_id = $2 AND is_deleted = false`, [id, workspaceId]);
				return exists ? 'CONFLICT' : null;
			}
			await tx.none(
				`INSERT INTO note_versions (id, note_id, workspace_id, version, title, body_md, edited_by) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
				[newUlid(), row.id, row.workspace_id, row.version, row.title, row.body_md, editedBy],
			);
			return this.mapRow(row);
		});
	}
}
```

`note.service.ts`:

```tsx
import { AppError } from '@lifeos/shared';
import { assertCapability, type Actor } from '@lifeos/permissions';

export class NoteService {
	constructor(private readonly repo: NoteRepo) {}

	async update(actor: Actor, id: string, expectedVersion: number, patch: { title?: string; bodyMd?: string }): Promise<Note> {
		assertCapability(actor, 'note:update');
		const res = await this.repo.updateWithVersion(id, actor.workspaceId, expectedVersion, patch, actor.userId);
		if (res === null) throw new AppError('NOTE_NOT_FOUND', 'Note not found.');
		if (res === 'CONFLICT') throw new AppError('NOTE_VERSION_CONFLICT', 'Note was modified by someone else.');
		return res;
	}
}
```

### Step 7 — Habits + Checkins (0126..0128)

`0126__habits.sql`:

```sql
BEGIN;
CREATE TABLE IF NOT EXISTS habits (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	created_by TEXT NOT NULL REFERENCES users(id),
	title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
	cadence TEXT NOT NULL DEFAULT 'daily' CHECK (cadence IN ('daily','weekly','monthly')),
	target_per_period INTEGER NOT NULL DEFAULT 1 CHECK (target_per_period >= 1),
	is_deleted BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMIT;
```

`0127__habit_checkins.sql`:

```sql
BEGIN;
CREATE TABLE IF NOT EXISTS habit_checkins (
	id TEXT PRIMARY KEY,
	habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	user_id TEXT NOT NULL REFERENCES users(id),
	checkin_date DATE NOT NULL,
	note TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT uq_habit_checkin_day UNIQUE (habit_id, user_id, checkin_date)
);
CREATE INDEX IF NOT EXISTS idx_habit_checkins_ws_date ON habit_checkins(workspace_id, checkin_date DESC);
COMMIT;
```

`0128__habits_rls.sql`:

```sql
BEGIN;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits FORCE ROW LEVEL SECURITY;
CREATE POLICY habits_isolation ON habits
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));

ALTER TABLE habit_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_checkins FORCE ROW LEVEL SECURITY;
CREATE POLICY habit_checkins_isolation ON habit_checkins
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;
```

`habit.service.ts` (نقطة الأهمية: التعامل مع `uq_habit_checkin_day` violation):

```tsx
import { AppError } from '@lifeos/shared';
import { assertCapability, type Actor } from '@lifeos/permissions';

export class HabitService {
	constructor(private readonly repo: HabitRepo) {}

	async checkin(actor: Actor, habitId: string, checkinDate: string, note?: string): Promise<HabitCheckin> {
		assertCapability(actor, 'habit:checkin');
		try {
			return await this.repo.createCheckin({ habitId, workspaceId: actor.workspaceId, userId: actor.userId, checkinDate, note });
		} catch (e: unknown) {
			if (this.isUniqueViolation(e, 'uq_habit_checkin_day')) {
				throw new AppError('HABIT_CHECKIN_DUPLICATE', 'Already checked in for this date.');
			}
			throw e;
		}
	}

	private isUniqueViolation(e: unknown, constraint: string): boolean {
		return typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === '23505' && 'constraint' in e && (e as { constraint: string }).constraint === constraint;
	}
}
```

### Step 8 — Expenses + Budgets (0129..0131)

`0129__expenses.sql`:

```sql
BEGIN;
CREATE TABLE IF NOT EXISTS expenses (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	created_by TEXT NOT NULL REFERENCES users(id),
	amount_cents BIGINT NOT NULL CHECK (amount_cents >= 0),
	currency CHAR(3) NOT NULL,
	category TEXT NOT NULL,
	description TEXT,
	spent_at DATE NOT NULL,
	is_deleted BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expenses_ws_spent ON expenses(workspace_id, spent_at DESC) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_expenses_ws_cat ON expenses(workspace_id, category) WHERE is_deleted = false;
COMMIT;
```

`0130__budgets.sql`:

```sql
BEGIN;
CREATE TABLE IF NOT EXISTS budgets (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	category TEXT NOT NULL,
	monthly_limit_cents BIGINT NOT NULL CHECK (monthly_limit_cents > 0),
	currency CHAR(3) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT uq_budget_ws_cat UNIQUE (workspace_id, category)
);
COMMIT;
```

`0131__expenses_rls.sql`:

```sql
BEGIN;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses FORCE ROW LEVEL SECURITY;
CREATE POLICY expenses_isolation ON expenses
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets FORCE ROW LEVEL SECURITY;
CREATE POLICY budgets_isolation ON budgets
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;
```

`expense.service.ts` (نقطة الأهمية: تجميع الـ usage + check البودجت):

```tsx
import { AppError } from '@lifeos/shared';
import { assertCapability, type Actor } from '@lifeos/permissions';

export class ExpenseService {
	constructor(private readonly expenses: ExpenseRepo, private readonly budgets: BudgetRepo) {}

	async create(actor: Actor, input: { amountCents: bigint; currency: string; category: string; description?: string; spentAt: string; }): Promise<Expense> {
		assertCapability(actor, 'expense:create');
		if (input.amountCents < 0n) {
			throw new AppError('EXPENSE_AMOUNT_INVALID', 'Amount must be non-negative.');
		}
		// budget check + insert happen INSIDE one transaction with FOR UPDATE
		// on the budget row, so concurrent requests cannot exceed the limit (race-free).
		return this.expenses.createWithBudgetCheck({
			workspaceId: actor.workspaceId,
			createdBy: actor.userId,
			...input,
		});
	}
}
```

`packages/services/src/expenses/expense.repo.ts` (race-free budget check):

```tsx
import { BaseRepo } from '@lifeos/repo';
import { AppError, newUlid } from '@lifeos/shared';

export class ExpenseRepo extends BaseRepo<Expense, ExpenseRow> {
	protected readonly table = 'expenses';
	protected readonly columns = [
		'id','workspace_id','created_by','amount_cents','currency','category',
		'description','spent_at','created_at','updated_at',
	] as const;
	protected mapRow(r: ExpenseRow): Expense { /* ... */ return r as unknown as Expense; }

	async createWithBudgetCheck(input: {
		workspaceId: string; createdBy: string;
		amountCents: bigint; currency: string;
		category: string; description?: string; spentAt: string;
	}): Promise<Expense> {
		return this.db.tx(async (tx) => {
			// 1) Lock the budget row for this (workspace, category, currency) — NULL if no budget.
			const budget = await tx.oneOrNone<{ monthly_limit_cents: string }>(
				`SELECT monthly_limit_cents::text<br>				  FROM budgets<br>				  WHERE workspace_id = $1 AND category = $2 AND currency = $3<br>				  FOR UPDATE`,
				[input.workspaceId, input.category, input.currency],
			);
			if (budget) {
				// 2) SUM existing expenses for this calendar month under the same lock.
				const monthStart = `${input.spentAt.slice(0, 7)}-01`;
				const sumRow = await tx.one<{ s: string }>(
					`SELECT COALESCE(SUM(amount_cents), 0)::text AS s<br>					  FROM expenses<br>					  WHERE workspace_id = $1 AND category = $2 AND is_deleted = false<br>					    AND spent_at >= $3::date<br>					    AND spent_at <  ($3::date + INTERVAL '1 month')`,
					[input.workspaceId, input.category, monthStart],
				);
				const monthTotal = BigInt(sumRow.s);
				const limit = BigInt(budget.monthly_limit_cents);
				if (monthTotal + input.amountCents > limit) {
					throw new AppError('BUDGET_EXCEEDED',
						`Adding this expense would exceed the monthly budget for category '${input.category}'.`,
						{ category: input.category, currentTotalCents: monthTotal.toString(), limitCents: limit.toString() });
				}
			}
			// 3) INSERT under the SAME transaction (budget row still locked).
			const id = newUlid();
			const row = await tx.one<ExpenseRow>(
				`INSERT INTO expenses (id, workspace_id, created_by, amount_cents, currency, category, description, spent_at)<br>				   VALUES ($1,$2,$3,$4,$5,$6,$7,$8::date)<br>				   RETURNING ${this.selectList()}`,
				[id, input.workspaceId, input.createdBy, input.amountCents, input.currency,
				 input.category, input.description ?? null, input.spentAt],
			);
			return this.mapRow(row);
		});
	}
}
```

### Step 9 — Calendar Events (0132..0133)

`0132__calendar_events.sql`:

```sql
BEGIN;
CREATE TABLE IF NOT EXISTS calendar_events (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	created_by TEXT NOT NULL REFERENCES users(id),
	title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
	starts_at TIMESTAMPTZ NOT NULL,
	ends_at TIMESTAMPTZ NOT NULL,
	all_day BOOLEAN NOT NULL DEFAULT false,
	location TEXT,
	notes TEXT,
	timezone TEXT NOT NULL DEFAULT 'UTC',
	is_deleted BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT chk_event_time CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_cal_ws_starts ON calendar_events(workspace_id, starts_at) WHERE is_deleted = false;
COMMIT;
```

`0133__calendar_rls.sql`:

```sql
BEGIN;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events FORCE ROW LEVEL SECURITY;
CREATE POLICY calendar_events_isolation ON calendar_events
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;
```

`calendar.service.ts` (نقطة الأهمية: time validation في الـ app layer قبل DB):

```tsx
import { AppError } from '@lifeos/shared';
import { assertCapability, type Actor } from '@lifeos/permissions';

export class CalendarService {
	constructor(private readonly repo: CalendarRepo) {}

	async create(actor: Actor, input: { title: string; startsAt: Date; endsAt: Date; allDay?: boolean; location?: string; notes?: string; timezone?: string; }): Promise<CalendarEvent> {
		assertCapability(actor, 'calendar:create');
		if (input.endsAt.getTime() <= input.startsAt.getTime()) {
			throw new AppError('CALENDAR_TIME_INVALID', 'Event end time must be after start time.');
		}
		return this.repo.create({ workspaceId: actor.workspaceId, createdBy: actor.userId, ...input });
	}
}
```

### Step 10 — Vault metadata (0134..0135) — متابعة في Phase 04 للـ crypto

`0134__vault_items_metadata.sql`:

```sql
-- File: 0134__vault_items_metadata.sql
-- Phase: 03
-- Description: Vault items METADATA ONLY. Encrypted blob columns added in Phase 04.
-- Idempotent: YES
BEGIN;
CREATE TABLE IF NOT EXISTS vault_items (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	owner_user_id TEXT NOT NULL REFERENCES users(id),
	item_type TEXT NOT NULL CHECK (item_type IN ('password','note','card','identity','file_ref')),
	title_hash TEXT NOT NULL,
	tags TEXT[] NOT NULL DEFAULT '{}',
	is_deleted BOOLEAN NOT NULL DEFAULT false,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vault_ws_owner ON vault_items(workspace_id, owner_user_id) WHERE is_deleted = false;
-- NOTE (Phase 04): the following columns will be ADDED in 0XXX migrations:
--   encrypted_blob BYTEA NOT NULL
--   nonce BYTEA NOT NULL
--   wrapped_dek BYTEA NOT NULL
--   dek_kdf_salt BYTEA NOT NULL
COMMIT;
```

`0135__vault_rls.sql`:

```sql
BEGIN;
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items FORCE ROW LEVEL SECURITY;
-- Vault: workspace isolation + owner-only access (vault is per-user, not shared)
CREATE POLICY vault_items_isolation ON vault_items
	USING (
		workspace_id = current_setting('app.current_workspace_id', true)
		AND owner_user_id = current_setting('app.current_user_id', true)
	)
	WITH CHECK (
		workspace_id = current_setting('app.current_workspace_id', true)
		AND owner_user_id = current_setting('app.current_user_id', true)
	);
COMMIT;
```

**ملاحظة إلزامية:** سياسة vault تتطلب `app.current_user_id` بالإضافة إلى `app.current_workspace_id`. تأكد أن `withWorkspaceContext` يضع كلا المتغيرين (هذا يجب أن يكون متوفرًا من Phase 02 — أضف اختبار pgTAP يتحقق).

### Step 11 — AI Usage + RPCs (0136..0139)

`0136__ai_usage_events.sql`:

```sql
BEGIN;
CREATE TABLE IF NOT EXISTS ai_usage_events (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	user_id TEXT NOT NULL REFERENCES users(id),
	idempotency_key TEXT NOT NULL,
	tokens_reserved BIGINT NOT NULL CHECK (tokens_reserved >= 0),
	tokens_used BIGINT CHECK (tokens_used IS NULL OR tokens_used >= 0),
	status TEXT NOT NULL CHECK (status IN ('reserved','completed','refunded')),
	model TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	completed_at TIMESTAMPTZ,
	CONSTRAINT uq_ai_usage_idem UNIQUE (workspace_id, idempotency_key)
);
COMMIT;
```

`0137__ai_usage_indexes.sql`:

```sql
BEGIN;
CREATE INDEX IF NOT EXISTS idx_ai_usage_ws_month ON ai_usage_events(workspace_id, date_trunc('month', created_at));
CREATE INDEX IF NOT EXISTS idx_ai_usage_ws_status ON ai_usage_events(workspace_id, status);
COMMIT;
```

`0138__ai_usage_rls.sql`:

```sql
BEGIN;
ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_events FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_usage_isolation ON ai_usage_events
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;
```

`0139__ai_usage_rpcs.sql` (race-free):

```sql
-- File: 0139__ai_usage_rpcs.sql
-- Phase: 03
-- Description: Race-free AI quota reservation/completion/refund.
-- Idempotent: YES
BEGIN;

-- monthly_limit is read from workspaces.monthly_ai_token_limit (not a parameter — cannot be tampered)
-- completed events use COALESCE(tokens_used, 0) — NULL must not fall back to tokens_reserved
CREATE OR REPLACE FUNCTION reserve_ai_usage(
	p_event_id TEXT,
	p_workspace_id TEXT,
	p_user_id TEXT,
	p_idem_key TEXT,
	p_tokens BIGINT
) RETURNS ai_usage_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_existing ai_usage_events;
	v_used BIGINT;
	v_limit BIGINT;
	v_event ai_usage_events;
BEGIN
	IF p_tokens <= 0 THEN RAISE EXCEPTION 'AI_TOKENS_INVALID' USING ERRCODE = 'P0001'; END IF;

	SELECT * INTO v_existing FROM ai_usage_events
		WHERE workspace_id = p_workspace_id AND idempotency_key = p_idem_key;
	IF FOUND THEN RETURN v_existing; END IF;

	-- Lock the workspace row AND read its quota limit atomically.
	SELECT monthly_ai_token_limit INTO v_limit
		FROM workspaces WHERE id = p_workspace_id FOR UPDATE;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'WORKSPACE_NOT_FOUND' USING ERRCODE = 'P0005';
	END IF;

	SELECT COALESCE(SUM(
		CASE WHEN status = 'completed' THEN COALESCE(tokens_used, 0)
		     WHEN status = 'reserved'  THEN tokens_reserved
		     ELSE 0 END
	), 0) INTO v_used
	FROM ai_usage_events
	WHERE workspace_id = p_workspace_id
	  AND created_at >= date_trunc('month', now());

	IF v_used + p_tokens > v_limit THEN
		RAISE EXCEPTION 'AI_QUOTA_EXCEEDED' USING ERRCODE = 'P0002';
	END IF;

	INSERT INTO ai_usage_events(id, workspace_id, user_id, idempotency_key, tokens_reserved, status)
	VALUES (p_event_id, p_workspace_id, p_user_id, p_idem_key, p_tokens, 'reserved')
	RETURNING * INTO v_event;

	RETURN v_event;
END;
$$;

CREATE OR REPLACE FUNCTION complete_ai_usage(p_event_id TEXT, p_tokens_used BIGINT)
RETURNS ai_usage_events LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event ai_usage_events; BEGIN
	IF p_tokens_used < 0 THEN RAISE EXCEPTION 'AI_TOKENS_INVALID' USING ERRCODE = 'P0001'; END IF;
	UPDATE ai_usage_events SET status = 'completed', tokens_used = p_tokens_used, completed_at = now()
	 WHERE id = p_event_id AND status = 'reserved' RETURNING * INTO v_event;
	IF NOT FOUND THEN RAISE EXCEPTION 'AI_USAGE_NOT_RESERVED' USING ERRCODE = 'P0003'; END IF;
	RETURN v_event;
END; $$;

CREATE OR REPLACE FUNCTION refund_ai_usage(p_event_id TEXT)
RETURNS ai_usage_events LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event ai_usage_events; BEGIN
	UPDATE ai_usage_events SET status = 'refunded', tokens_reserved = 0, tokens_used = 0, completed_at = now()
	 WHERE id = p_event_id AND status IN ('reserved','completed') RETURNING * INTO v_event;
	IF NOT FOUND THEN RAISE EXCEPTION 'AI_USAGE_NOT_REFUNDABLE' USING ERRCODE = 'P0004'; END IF;
	RETURN v_event;
END; $$;

COMMIT;
```

`ai-quota.service.ts`:

```tsx
import { AppError } from '@lifeos/shared';
import { newUlid } from '@lifeos/shared';
import { assertCapability, type Actor } from '@lifeos/permissions';

export class AiQuotaService {
	constructor(private readonly db: DbClient) {}

	async reserve(actor: Actor, input: { idempotencyKey: string; tokens: bigint; model?: string; }): Promise<AiUsageEvent> {
		// monthlyLimit removed — RPC reads it from workspaces.monthly_ai_token_limit.
		assertCapability(actor, 'ai:use');
		const eventId = newUlid();
		try {
			return await this.db.one<AiUsageEvent>(
				`SELECT * FROM reserve_ai_usage($1,$2,$3,$4,$5)`,
				[eventId, actor.workspaceId, actor.userId, input.idempotencyKey, input.tokens],
			);
		} catch (e) {
			const code = this.pgErrorCode(e);
			if (code === 'P0002') throw new AppError('AI_QUOTA_EXCEEDED', 'Monthly AI quota exceeded.');
			if (code === 'P0005') throw new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found.');
			throw e;
		}
	}

	async complete(actor: Actor, eventId: string, tokensUsed: bigint): Promise<AiUsageEvent> {
		assertCapability(actor, 'ai:use');
		try {
			return await this.db.one<AiUsageEvent>(`SELECT * FROM complete_ai_usage($1,$2)`, [eventId, tokensUsed]);
		} catch (e) {
			if (this.pgErrorCode(e) === 'P0003') throw new AppError('AI_USAGE_NOT_RESERVED', 'AI usage event not in reserved state.');
			throw e;
		}
	}

	async refund(actor: Actor, eventId: string): Promise<AiUsageEvent> {
		assertCapability(actor, 'ai:use');
		try {
			return await this.db.one<AiUsageEvent>(`SELECT * FROM refund_ai_usage($1)`, [eventId]);
		} catch (e) {
			if (this.pgErrorCode(e) === 'P0004') throw new AppError('AI_USAGE_NOT_REFUNDABLE', 'AI usage event cannot be refunded.');
			throw e;
		}
	}

	private pgErrorCode(e: unknown): string | undefined {
		return typeof e === 'object' && e !== null && 'code' in e ? (e as { code: string }).code : undefined;
	}
}
```

### Step 12 — Baselines (0140..0147)

`0140__xp_events.sql`:

```sql
BEGIN;
CREATE TABLE IF NOT EXISTS xp_events (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	user_id TEXT NOT NULL REFERENCES users(id),
	source TEXT NOT NULL,
	delta INTEGER NOT NULL,
	metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_xp_ws_user ON xp_events(workspace_id, user_id, created_at DESC);
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events FORCE ROW LEVEL SECURITY;
CREATE POLICY xp_isolation ON xp_events
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;
```

`0141__daily_reviews.sql`:

```sql
BEGIN;
CREATE TABLE IF NOT EXISTS daily_reviews (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	user_id TEXT NOT NULL REFERENCES users(id),
	review_date DATE NOT NULL,
	mood SMALLINT CHECK (mood BETWEEN 1 AND 5),
	summary_md TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	CONSTRAINT uq_daily_review UNIQUE (user_id, review_date)
);
ALTER TABLE daily_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reviews FORCE ROW LEVEL SECURITY;
CREATE POLICY daily_reviews_isolation ON daily_reviews
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;
```

`0142__import_jobs.sql`:

```sql
BEGIN;
CREATE TABLE IF NOT EXISTS import_jobs (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	created_by TEXT NOT NULL REFERENCES users(id),
	source TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed')),
	total_rows INTEGER NOT NULL DEFAULT 0,
	processed_rows INTEGER NOT NULL DEFAULT 0,
	error_message TEXT,
	started_at TIMESTAMPTZ,
	finished_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_jobs FORCE ROW LEVEL SECURITY;
CREATE POLICY import_jobs_isolation ON import_jobs
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;
```

`0143__public_shares.sql`:

```sql
BEGIN;
CREATE TABLE IF NOT EXISTS public_shares (
	id TEXT PRIMARY KEY,
	workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	resource_type TEXT NOT NULL CHECK (resource_type IN ('page','note')),
	resource_id TEXT NOT NULL,
	token_hash TEXT NOT NULL UNIQUE,
	created_by TEXT NOT NULL REFERENCES users(id),
	expires_at TIMESTAMPTZ,
	revoked_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_public_shares_ws_res ON public_shares(workspace_id, resource_type, resource_id);
ALTER TABLE public_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_shares FORCE ROW LEVEL SECURITY;
CREATE POLICY public_shares_isolation ON public_shares
	USING (workspace_id = current_setting('app.current_workspace_id', true))
	WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true));
COMMIT;
```

**ملاحظة:** الـ public share lookup من خارج workspace context يتم عبر `SECURITY DEFINER` function في Phase 04 (لأنه يحتاج bypass للـ RLS بشكل آمن). هنا فقط الـ schema.

`0144__webhook_nonces.sql`:

```sql
BEGIN;
CREATE TABLE IF NOT EXISTS webhook_nonces (
	nonce TEXT PRIMARY KEY,
	provider TEXT NOT NULL,
	received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_webhook_nonces_received ON webhook_nonces(received_at);
-- No RLS — webhook_nonces is global (not tenant-scoped) and accessed only by trusted webhook handler
COMMIT;
```

`0145__audit_logs_extensions.sql`:

```sql
-- Self-sufficient guard — CREATE the table if absent. Idempotent against any pre-existing audit_logs.
BEGIN;
CREATE TABLE IF NOT EXISTS audit_logs (
	id TEXT PRIMARY KEY,
	workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
	actor_user_id TEXT REFERENCES users(id),
	event_type TEXT NOT NULL,
	payload JSONB NOT NULL DEFAULT '{}'::jsonb,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE audit_logs
	ADD COLUMN IF NOT EXISTS resource_type TEXT,
	ADD COLUMN IF NOT EXISTS resource_id TEXT,
	ADD COLUMN IF NOT EXISTS ip_address INET,
	ADD COLUMN IF NOT EXISTS user_agent TEXT;
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(workspace_id, resource_type, resource_id);
COMMIT;
-- ROLLBACK:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_audit_resource;
-- ALTER TABLE audit_logs DROP COLUMN IF EXISTS user_agent, DROP COLUMN IF EXISTS ip_address, DROP COLUMN IF EXISTS resource_id, DROP COLUMN IF EXISTS resource_type;
-- COMMIT;
```

`0146__rate_limit_buckets_extensions.sql`:

```sql
-- Self-sufficient guard — CREATE if absent.
-- NOTE: rate_limit_buckets.tokens is NOT money (leaky-bucket counter), so NUMERIC is allowed here only.
BEGIN;
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
	id TEXT PRIMARY KEY,
	bucket_key TEXT NOT NULL UNIQUE,
	tokens NUMERIC NOT NULL DEFAULT 0,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE rate_limit_buckets
	ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'global',
	ADD COLUMN IF NOT EXISTS workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_rl_ws_scope ON rate_limit_buckets(workspace_id, scope) WHERE workspace_id IS NOT NULL;
COMMIT;
-- ROLLBACK:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_rl_ws_scope;
-- ALTER TABLE rate_limit_buckets DROP COLUMN IF EXISTS workspace_id, DROP COLUMN IF EXISTS scope;
-- COMMIT;
```

`0147__outbound_emails.sql`:

```sql
BEGIN;
CREATE TABLE IF NOT EXISTS outbound_emails (
	id TEXT PRIMARY KEY,
	workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
	to_email TEXT NOT NULL,
	template TEXT NOT NULL,
	payload JSONB NOT NULL DEFAULT '{}'::jsonb,
	status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','suppressed')),
	attempts SMALLINT NOT NULL DEFAULT 0,
	last_error TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_outbound_status ON outbound_emails(status, created_at) WHERE status IN ('queued','failed');
-- No RLS — outbound_emails is system-internal (accessed by mailer worker only)
COMMIT;
```

## 7. اختبارات إلزامية

### 7.1 pgTAP — RLS isolation لكل جدول tenant-scoped

**SECURITY DEFINER fixture helper** (one-time setup, must run before any pgTAP suite — managed via Phase 02's `scripts/migrate.ts` test bootstrap, NOT via a regular phase migration):

```sql
-- File: tests/pgtap/_setup.sql (idempotent, run once per test DB)
CREATE OR REPLACE FUNCTION _test_seed_row(p_sql TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
	-- SECURITY DEFINER runs as the function owner (a migration role that owns all tables),
	-- which by default bypasses RLS on its OWN tables — no superuser or row_security toggle needed.
	EXECUTE p_sql;
END; $$;
-- Restrict to test role only; never exposed in production schema_migrations.
REVOKE ALL ON FUNCTION _test_seed_row(TEXT) FROM PUBLIC;
```

قالب موحَّد (`tests/pgtap/0120_tasks_rls.sql`):

```sql
BEGIN;
SELECT plan(4);

-- Seed via SECURITY DEFINER helper (no superuser, no `SET LOCAL row_security`).
SELECT _test_seed_row($$INSERT INTO users (id, email) VALUES ('u_a','a@test.io'),('u_b','b@test.io')$$);
SELECT _test_seed_row($$INSERT INTO workspaces (id, name, owner_user_id) VALUES ('ws_a','A','u_a'),('ws_b','B','u_b')$$);
SELECT _test_seed_row($$INSERT INTO tasks (id, workspace_id, created_by, title) VALUES ('t_a','ws_a','u_a','Task in A'),('t_b','ws_b','u_b','Task in B')$$);

-- Test 1: workspace A sees only its tasks
SELECT set_config('app.current_workspace_id', 'ws_a', true);
SELECT set_config('app.current_user_id', 'u_a', true);
SELECT is((SELECT count(*)::int FROM tasks), 1, 'ws_a sees 1 task');
SELECT is((SELECT id FROM tasks), 't_a', 'ws_a sees only t_a');

-- Test 2: workspace B sees only its tasks
SELECT set_config('app.current_workspace_id', 'ws_b', true);
SELECT is((SELECT id FROM tasks), 't_b', 'ws_b sees only t_b');

-- Test 3: cross-tenant INSERT rejected by WITH CHECK
SELECT set_config('app.current_workspace_id', 'ws_a', true);
SELECT throws_ok(
	$$ INSERT INTO tasks (id, workspace_id, created_by, title) VALUES ('t_x', 'ws_b', 'u_a', 'evil') $$,
	'42501',
	 NULL,
	'cross-tenant INSERT is rejected'
);

SELECT * FROM finish();
ROLLBACK;
```

كرِّر القالب لكل: notes, habits, expenses, calendar, vault, ai_usage. ملف vault يتطلب أيضًا اختبار `owner_user_id` filter.

### 7.2 Vitest — AI quota race condition

`tests/unit/ai-quota-race.test.ts`:

```tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { testDb, resetSchema } from '../helpers/db';

describe('reserve_ai_usage', () => {
	beforeEach(async () => { await resetSchema(); });

	it('caps 100 concurrent reservations at the monthly limit', async () => {
		await testDb.none(`INSERT INTO users (id, email) VALUES ('u_1','t@x')`);
		await testDb.none(`INSERT INTO workspaces (id, name, owner_user_id, monthly_ai_token_limit) VALUES ('ws_1','t','u_1',500)`);

		const calls = Array.from({ length: 100 }, (_, i) =>
			testDb.one(`SELECT * FROM reserve_ai_usage($1,$2,$3,$4,$5)`,
				[`evt_${i}`, 'ws_1', 'u_1', `k_${i}`, 10]).catch((e) => ({ error: e.message })),
		);
		const results = await Promise.all(calls);
		const accepted = results.filter((r: any) => !r.error).length;
		expect(accepted).toBe(50);  // 500 / 10
	});
});
```

`tests/unit/ai-quota-idempotency.test.ts`:

```tsx
it('returns the same row for a repeated idempotency key', async () => {
	// monthly_ai_token_limit lives on workspaces table (set in beforeEach with limit=100).
	const a = await testDb.one(`SELECT * FROM reserve_ai_usage($1,$2,$3,$4,$5)`, ['e1','ws_1','u_1','same',10]);
	const b = await testDb.one(`SELECT * FROM reserve_ai_usage($1,$2,$3,$4,$5)`, ['e2','ws_1','u_1','same',10]);
	expect(a.id).toBe(b.id);
});
```

`tests/unit/ai-quota-refund.test.ts`:

```tsx
it('refund never produces negative usage', async () => {
	// monthly_ai_token_limit set on workspace ws_3 in fixture (limit=100).
	const ev = await testDb.one(`SELECT * FROM reserve_ai_usage($1,$2,$3,$4,$5)`, ['e1','ws_3','u_1','r1',25]);
	await testDb.one(`SELECT * FROM refund_ai_usage($1)`, [ev.id]);
	const sum = await testDb.one(`SELECT COALESCE(SUM(tokens_reserved),0)::bigint AS s FROM ai_usage_events WHERE workspace_id=$1`, ['ws_3']);
	expect(Number(sum.s)).toBeGreaterThanOrEqual(0);
});
```

### 7.3 Vitest — money types

`tests/unit/expenses-money.test.ts`:

```tsx
it('rejects float amount via type', () => {
	// TS compile error if AmountCents is bigint; runtime guard if any:
	const amount: bigint = 1099n;
	expect(typeof amount).toBe('bigint');
});

it('refuses negative amount', async () => {
	await expect(svc.create(actor, { amountCents: -5n, currency: 'USD', category: 'food', spentAt: '2026-05-01' })).rejects.toThrow();
});
```

### 7.4 Vitest — note version conflict

```tsx
it('throws NOTE_VERSION_CONFLICT on stale write', async () => {
	const note = await svc.create(actor, { title: 'A', bodyMd: '' });
	await svc.update(actor, note.id, 1, { title: 'B' });
	await expect(svc.update(actor, note.id, 1, { title: 'C' })).rejects.toMatchObject({ code: 'NOTE_VERSION_CONFLICT' });
});
```

### 7.5 Vitest — habit checkin duplicate

```tsx
it('throws HABIT_CHECKIN_DUPLICATE on same day', async () => {
	await svc.checkin(actor, habit.id, '2026-05-01');
	await expect(svc.checkin(actor, habit.id, '2026-05-01')).rejects.toMatchObject({ code: 'HABIT_CHECKIN_DUPLICATE' });
});
```

### 7.6 Vitest — calendar time validation

```tsx
it('throws CALENDAR_TIME_INVALID when end <= start', async () => {
	const start = new Date('2026-05-01T10:00:00Z');
	await expect(svc.create(actor, { title: 'x', startsAt: start, endsAt: start })).rejects.toMatchObject({ code: 'CALENDAR_TIME_INVALID' });
});
```

### 7.7 Integration — no SELECT * in any repo

`tests/integration/repos-no-select-star.test.ts`:

```tsx
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir: string, out: string[] = []) {
	for (const e of readdirSync(dir)) {
		if (e === 'node_modules' || e === '.git') continue;
		const p = join(dir, e);
		if (statSync(p).isDirectory()) walk(p, out);
		else if (p.endsWith('.repo.ts')) out.push(p);
	}
	return out;
}

it('no repo file contains SELECT *', () => {
	const offenders: string[] = [];
	for (const f of walk('packages/services')) {
		const src = readFileSync(f, 'utf8');
		if (/SELECT\s+\*/i.test(src)) offenders.push(f);
	}
	expect(offenders).toEqual([]);
});
```

## 8. تحذيرات للـ AI Executor

- ❌ لا تكتب UI.
- ❌ لا تكتب SQL داخل route handlers — كل SQL داخل repos.
- ❌ لا تستخدم `SELECT *` نهائيًا.
- ❌ لا تعمل destructive migrations (DROP COLUMN على prod tables) إلا عبر ADR صريح.
- ❌ لا تخزن vault plaintext — العمود `title_hash` فقط، الباقي يأتي في Phase 04.
- ❌ لا تضيف AI prompt فعلي — Phase 03 يبني الـ ledger فقط.
- ❌ لا تضيف Stripe / Billing — هذا في wave مستقبلي.
- ❌ لا تكرر تعريف `AppError` — `import` من `@lifeos/shared`.
- ❌ لا تستخدم `NUMERIC` / `DECIMAL` / `FLOAT` للمال — `BIGINT` cents فقط.
- ❌ لا تنسى `ENABLE` + `FORCE ROW LEVEL SECURITY` على كل tenant tables.
- ❌ لا تستدع `reserve_ai_usage` من route مباشرة — استخدم `AiQuotaService.reserve()`.
- ❌ لا تحسب الـ AI quota في TypeScript — race condition مؤكدة.
- ❌ لا تضع `created_by` كـ default — اطلبه صراحة من `actor.userId`.
- ❌ لا تتجاهل `version` في notes update — استخدم `updateWithVersion`.
- ❌ لا تستخدم `Date.now()` مباشرة في business code — استخدم `systemClock.nowMs()`.
- ❌ لا تنسى `-- ROLLBACK:` footer في كل migration.

## 9. Checklist النهائي

- [ ]  Branch `phase/03-domain-schemas` مفتوح.
- [ ]  `docs/preflight-phase-03.md` مكتوب ومحدَّث.
- [ ]  AppError codes ممدَّدة (19 code جديد) + `STATUS_MAP` محدَّث.
- [ ]  `BaseRepo` يجبر explicit columns.
- [ ]  migrations 0119..0147 مكتوبة + idempotent + `-- ROLLBACK:` footer.
- [ ]  7 repos (task/note/habit/expense+budget/calendar/vault-meta/ai-quota) + 4 repos baseline (xp/review/import/share).
- [ ]  7 services + 4 baseline services.
- [ ]  كل tenant tables: `ENABLE` + `FORCE ROW LEVEL SECURITY` + policy.
- [ ]  vault policy تشترط `owner_user_id = app.current_user_id` بالإضافة للـ workspace.
- [ ]  AI quota RPCs: `reserve_ai_usage`, `complete_ai_usage`, `refund_ai_usage` كـ `SECURITY DEFINER`.
- [ ]  pgTAP tests لكل tenant table (7 ملفات).
- [ ]  Vitest: race / idempotency / refund / money / version / duplicate-checkin / time-validation / no-select-star.
- [ ]  `audit_logs` مُمدَّد بـ resource_type/resource_id/ip_address/user_agent.
- [ ]  `outbound_emails` + `webhook_nonces` + `import_jobs` + `public_shares` + `xp_events` + `daily_reviews` جاهزة.
- [ ]  `scripts/migrate.ts` يُسجِّل كل migration بـ `phase='03'` في `schema_migrations`.
- [ ]  money scan: لا توجد أعمدة float للمال.
- [ ]  grep `SELECT *` في packages/services → فارغ.
- [ ]  grep `class AppError` في كل المشروع → نتيجة واحدة (Phase 01).
- [ ]  ADRs 0010..0017 مكتوبة (8 إجمالًا).
- [ ]  `packages/repo` مسجّلة في `pnpm-workspace.yaml` + root tsconfig references + package.json + tsconfig.json.
- [ ]  `_test_seed_row(p_sql)` SECURITY DEFINER helper مثبّت في `tests/pgtap/_setup.sql`.
- [ ]  لا يوجد `new Date(...)` في `task.repo.ts` (ولا أي repo) — SQL `now()` فقط.
- [ ]  `db.result()` لا يوجد في أي repo (grep) — البديل `oneOrNone(... RETURNING ...)`.
- [ ]  `docs/execution/phase-03-outputs.md` مكتوب.
- [ ]  `docs/runbooks/rollback-phase-03.md` مكتوب.
- [ ]  CI أخضر.
- [ ]  PR merged إلى `main`.
- [ ]  tag `phase-03-locked` annotated.

## 10. Definition of Done

Phase 03 جاهزة عندما وفقط عندما:

- كل migrations 0119..0147 طُبِّقت ومُسجَّلة في `schema_migrations`.
- كل tenant tables تمر pgTAP isolation tests.
- AI quota RPCs تمر الـ race + idempotency + refund tests.
- لا يوجد `SELECT *` في أي repo.
- لا يوجد `NUMERIC`/`DECIMAL`/`FLOAT` لأي حقل مالي.
- لا يوجد plaintext في `vault_items`.
- لا يوجد SQL داخل route handlers.
- `AppError` معرَّف في مكان واحد (`@lifeos/shared`).
- 19 error code جديد + status mapping يعمل.
- جميع الـ services تستدعي `assertCapability` (من `@lifeos/permissions`) كنقطة قرار الصلاحيات الوحيدة.
- `Actor` type معرّف في `@lifeos/permissions` ومُصدّر للـ services.
- `packages/repo` موجود في workspace و `pnpm typecheck` أخضر.
- `monthly_ai_token_limit` مخزّن على `workspaces` (لا يُمرَر من application).
- `audit_logs` و `rate_limit_buckets` موجودان بعد migrations 0145/0146 (CREATE TABLE IF NOT EXISTS guards).
- `docs/execution/phase-03-outputs.md` يُلخِّص العقد للـ Phase 04/05.
- CI أخضر + tag `phase-03-locked` annotated.

## 11. سجل القرارات

| القرار | الـ ADR | الملاحظة |
| --- | --- | --- |
| D-035 — Money as BIGINT cents | 0010 | ممنوع floats/NUMERIC للمال |
| D-036 — AI quota via RPC + FOR UPDATE | 0011 | race-free + idempotent |
| D-037 — Note version optimistic concurrency | 0012 | `version` column يُزاد في كل UPDATE |
| D-038 — Vault metadata vs crypto separation | 0013 | Phase 03 metadata فقط، crypto في Phase 04 |
| D-039 — BaseRepo enforces explicit columns | 0014 | ممنوع `SELECT *` |
| D-040 — Vault RLS requires user_id | — | `app.current_user_id` بالإضافة للـ workspace |
| D-041 — RPCs as SECURITY DEFINER | 0011 | يستخدم `SET search_path = public` للأمان |
| D-042 — Public share lookup deferred to Phase 04 | 0013 | يحتاج SECURITY DEFINER function في الـ wave التالي |
| D-043 — outbound_emails + webhook_nonces no-RLS | — | non-tenant tables |
| D-044 — AI quota: tokens_used preferred over tokens_reserved for completed events | 0011 | يدخل في حساب الاستخدام الشهري — `COALESCE(tokens_used, 0)` (ليس `tokens_reserved`) لتجنب NULL fallback bug |
| D-045 — `Actor` type يعيش في `@lifeos/permissions` | 0015 | كل الـ services تستورد `import { assertCapability, type Actor } from '@lifeos/permissions';` |
| D-046 — `monthly_ai_token_limit` BIGINT column on `workspaces` | 0016 | الحد الشهري لا يُمرَر كـ parameter (تلاعب محتمل) — الـ RPC تقرأه FOR UPDATE من DB مباشرةً |
| D-047 — Budget check transactional in `ExpenseRepo.createWithBudgetCheck` | 0017 | `FOR UPDATE` على `budgets` row + SUM + INSERT داخل `db.tx()` (race-free) |
| D-048 — `ErrorCode` union تُمدَّد عبر declaration merging | — | `interface ErrorCodeRegistry`  • `keyof` بدل const object ليضمن TypeScript checking حقيقي |
| D-049 — pgTAP fixtures عبر `_test_seed_row` SECURITY DEFINER helper | — | لا يتطلب superuser ولا `SET LOCAL row_security` |
| D-050 — `packages/repo` مسجلة صراحةً في Phase 03 | — | تُضاف في Step 3.1 مع package.json + tsconfig.json + pnpm-workspace.yaml + root references |
| D-051 — `BaseRepo.softDelete` flag اختياري | 0014 | الجداول append-only (note_versions / habit_checkins / xp_events / daily_reviews / webhook_nonces) تجعله `false` |
| D-052 — `audit_logs` و `rate_limit_buckets` self-sufficient guards | — | 0145/0146 تبدأ بـ `CREATE TABLE IF NOT EXISTS` ثم ALTER (idempotent) |
| D-053 — No `new Date()` in repos | — | SQL `now()` عبر CASE expression (`task.repo.ts.updateStatus`) |

## 12. مخرجات Phase 03 (`docs/execution/phase-03-outputs.md`)

يجب أن يحوي صراحةً:

### A. Migrations applied

```
0119..0147 (29 migrations)
Next available migration number: 0148
Reserved range for Phase 03 patches: 0148..0199
```

### B. Tables introduced

```
tasks, notes, note_versions, habits, habit_checkins,
expenses, budgets, calendar_events, vault_items (metadata only),
ai_usage_events, xp_events, daily_reviews, import_jobs,
public_shares, webhook_nonces, outbound_emails
```

### C. Sensitive columns inventory

| Table | Column | Type | Note |
| --- | --- | --- | --- |
| `expenses` | `amount_cents` | BIGINT | money (ADR 0010) |
| `budgets` | `monthly_limit_cents` | BIGINT | money (ADR 0010) |
| `vault_items` | `title_hash` | TEXT | hash, not plaintext (ADR 0013) |
| `vault_items` | `encrypted_blob/nonce/wrapped_dek` | — | **added in Phase 04** |
| `public_shares` | `token_hash` | TEXT | hash of share token |
| `audit_logs` | `ip_address` | INET | PII |
| `audit_logs` | `user_agent` | TEXT | PII |

### D. AI quota defaults

```
Default monthly_limit_tokens per workspace: 100_000 (configurable)
Reserved tokens count toward usage until refunded
Completed events use tokens_used (final), reserved events use tokens_reserved (estimate)
```

### E. Capabilities introduced

```
task:create, task:update, task:delete
note:create, note:update, note:delete, note:read-version-history
habit:create, habit:update, habit:delete, habit:checkin
expense:create, expense:update, expense:delete
budget:set
calendar:create, calendar:update, calendar:delete
vault:read-meta, vault:create-meta (full vault ops in Phase 04)
ai:use
xp:award (system-only)
review:write
import:start, import:read
share:create, share:revoke (lookup in Phase 04)
```

جميعها يجب أن تُسجَّل في `resolver.ts` registry قبل `phase-03-locked`.

### F. Services exported (consumed by Phase 04/05)

```
@lifeos/services/tasks: TaskService, TaskRepo, Task
@lifeos/services/notes: NoteService, NoteRepo, Note, NoteVersion
@lifeos/services/habits: HabitService, HabitRepo, Habit, HabitCheckin
@lifeos/services/expenses: ExpenseService, ExpenseRepo, BudgetRepo, Expense, Budget
@lifeos/services/calendar: CalendarService, CalendarRepo, CalendarEvent
@lifeos/services/vault: VaultMetaService, VaultMetaRepo, VaultItemMeta
@lifeos/services/ai: AiQuotaService, AiUsageEvent
@lifeos/services/xp: XpService
@lifeos/services/reviews: DailyReviewService
@lifeos/services/imports: ImportJobService
@lifeos/services/shares: PublicShareService
```

### F. AppError codes added (19)

راجع §6 Step 2 — كلها مُسجَّلة في `STATUS_MAP` وفي `ErrorCodeRegistry` interface.

```jsx
TASK_NOT_FOUND
NOTE_NOT_FOUND, NOTE_VERSION_CONFLICT
HABIT_NOT_FOUND, HABIT_CHECKIN_DUPLICATE
EXPENSE_NOT_FOUND, EXPENSE_AMOUNT_INVALID, BUDGET_EXCEEDED
CALENDAR_EVENT_NOT_FOUND, CALENDAR_TIME_INVALID
VAULT_ITEM_NOT_FOUND
AI_QUOTA_EXCEEDED, AI_USAGE_NOT_RESERVED, AI_USAGE_NOT_REFUNDABLE, WORKSPACE_NOT_FOUND
IMPORT_JOB_NOT_FOUND, PUBLIC_SHARE_NOT_FOUND, PUBLIC_SHARE_EXPIRED, WEBHOOK_NONCE_REUSED
```

### G. ADRs added

```jsx
0010-money-storage-bigint-cents.md
0011-ai-quota-race-free-rpc.md
0012-note-version-optimistic-concurrency.md
0013-vault-metadata-vs-crypto-separation.md
0014-base-repo-no-select-star.md
0015-actor-type-in-permissions.md
0016-workspace-monthly-ai-token-limit.md
0017-expense-budget-check-transactional.md
```

### H. Known limitations carried to Phase 04+

- `vault_items.encrypted_blob/nonce/wrapped_dek` لم تُضَف بعد — Phase 04.
- `public_shares` lookup من خارج workspace context يحتاج `SECURITY DEFINER` function — Phase 04.
- `outbound_emails` لا يوجد له worker حقيقي — Phase 04 (real email provider).
- `import_jobs` لا يوجد له worker حقيقي — Phase 06 (Importers wave).
- `xp_events` لا توجد قواعد ترقية — Phase 07 (Gamification wave).

## 13. Runbook التشغيل

```bash
# 1. Pull and verify Phase 02 state
git fetch --tags
git checkout phase-02-locked
pnpm install --frozen-lockfile
pnpm typecheck && pnpm lint && pnpm test

# 2. Open Phase 03 branch
git checkout -b phase/03-domain-schemas

# 3. Run migrations in dry-run mode first
pnpm db:migrate:dry

# 4. Apply migrations
pnpm db:migrate

# 5. Verify schema_migrations
psql $DATABASE_URL -c "SELECT version, phase, applied_at FROM schema_migrations WHERE phase = '03' ORDER BY version"

# 6. Run all tests
pnpm test
pnpm test:pgtap

# 7. Run scans
pnpm scan:money-floats
pnpm scan:select-star
pnpm scan:duplicate-app-error

# 8. Open PR, wait for CI green, merge
# 9. Tag
git tag -a phase-03-locked -m "Phase 03: Domain schemas + AI quota engine"
git push origin phase-03-locked
```

## 14. Rollback runbook (`docs/runbooks/rollback-phase-03.md`)

```markdown
# Rollback Phase 03

## Trigger
- CI fail on `phase-03-locked` candidate.
- Critical bug discovered post-deploy.

## Strategy
Phase 03 introduces 29 migrations (0119..0147). All have `-- ROLLBACK:` footer.

## Order
Rollback in REVERSE order: 0147 → 0119.

## Steps
1. `git revert` the PR merge commit.
2. Run `pnpm db:migrate:rollback --to 0118` (uses ROLLBACK footers).
3. Verify `schema_migrations` shows last version = 0118.
4. Delete tag: `git tag -d phase-03-locked && git push --delete origin phase-03-locked`.
5. Run full test suite against rolled-back DB.
6. Open incident postmortem doc.

## Data impact
- `tasks`, `notes`, `habits`, `expenses`, `calendar_events`, `vault_items`, `ai_usage_events`, `xp_events`, `daily_reviews`, `import_jobs`, `public_shares` will be DROPPED.
- `audit_logs` extension columns (resource_type, etc.) will be DROPPED.
- `users` extension columns (timezone, locale, display_name) will be DROPPED.
- Any data created during Phase 03 will be LOST.
- This is acceptable because Phase 03 is pre-launch.

## Forward-fix preferred
If the issue is isolated (e.g. one migration), prefer a forward-fix migration in 0148+ over a full rollback.
```

## 15. ملاحظات للـ AI Executor

- نفِّذ الـ steps بالترتيب الحرفي. ممنوع التخطي.
- لكل migration: اكتب الـ SQL، شغِّل `pnpm db:migrate:dry`، تحقَّق، ثم `pnpm db:migrate`.
- لكل repo: اكتب الـ `columns` array أولًا، ثم `mapRow`، ثم العمليات.
- لكل service: استدع `assertCapability(actor, '<capability>')` (من `@lifeos/permissions`) كأول سطر في كل method.
- لكل tenant table: تحقَّق `ENABLE` + `FORCE` + policy موجودة قبل الانتقال للجدول التالي.
- لو فشل اختبار pgTAP: لا تعدِّل الاختبار — أصلح الـ policy أو الـ schema.
- لو فشل money scan: أصلح العمود فورًا (BIGINT cents).
- لو grep `SELECT *` رجع نتيجة: عدِّل الـ repo قبل المتابعة.
- اكتب الـ ADR قبل الـ migration المرتبطة (التوثيق أولًا).
- في النهاية: `docs/execution/phase-03-outputs.md` لازم يكون نسخة طبق الأصل من القسم 12 أعلاه — هذا هو العقد للمرحلة التالية.