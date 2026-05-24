# مرحلة 5 — Zenith UI، Auth Flows، i18n، و Rate Limiting

<aside>
✨

**الفرع:** `phase/05-zenith-ui-auth`

**التاج:** `phase-05-locked` (annotated)

**نطاق الـ migrations:** `0200..0299` (Reserved per Phase 04 ADR-0023)

**التبعيات:** Phase 04 مُقفلة (`phase-04-locked`)

**نطاق هذه المرحلة:** طبقة Auth UI + i18n + Rate Limiting فقط فوق Phase 01..04. **هذه ليست نهاية الـ MVP** — يبقى 5 features من قائمة الـ 15 المُقفلة في Phase 00 (`dashboard`, `goals`, `calendar`, `search`, `ai-gateway`) لم تُنفَّذ بعد، بالإضافة لتوسعة UI لـ `pages/notes/tasks`. الـ MVP يُقفَل بعد اكتمال هذه الـ features في Phases 06..16+ وتحقيق metrics الـ `launch-criteria.md` — ليس هنا.

</aside>

## 1. الهدف والنطاق

هذه المرحلة تُكمل **طبقة Auth + Zenith UI + i18n + Rate Limiting** فوق Phase 01..04. النطاق محدود في طبقة Auth/UI — ليست قفلاً للـ MVP. تجمع كل طبقات Phase 01..04 في تجربة مستخدم نهائية:

- **Zenith UI integration**: دمج تصميم Zenith كـ in-place merge في `apps/web` (ليس app منفصل).
- **Auth flows**: signin / signup / password-reset / oauth-callback / signout.
- **Settings pages**: security / sessions / locale — كلها محمية بـ auth guard layout.
- **Email templates**: ar/en، MJML، ICU message format، per-locale rendering.
- **Rate limiting**: على كل auth routes (يستهلك `rate_limit_buckets` من Phase 02).
- **Design system enforcement**: `design-drift` script محسَّن مع استثناءات legitimate.
- **CSRF protection HOC**: `withCsrfProtection` يلف كل mutating route.

## 2. العقد مع المراحل السابقة

### 2.1 المُستهلَك من Phase 01

- `envelopeOk` + `envelopeErr` من `@lifeos/shared` — **NEVER `okEnvelope`** (تكرر الخطأ في Phase 03/04 وتم تصحيحه)
- `AppError` + `ErrorCodeRegistry` (declaration merging)
- `systemClock`, `logger`
- `timingSafeEqual` wrapper

### 2.2 المُستهلَك من Phase 02

- `verifyCsrf` من `@lifeos/auth-guard` — **مستقلة، ليست method على authService**
- `createSession`, `validateSession`, `revokeSession` من `@lifeos/auth`
- `hashPassword`, `verifyPassword` من `@lifeos/auth`
- `rate_limit_buckets` table — تُستهلك هنا لأول مرة في auth routes
- `withWorkspaceContext` لـ tenant DB
- `Idempotency-Key` middleware

### 2.3 المُستهلَك من Phase 03

- `assertCapability` من `@lifeos/permissions`
- `Actor` type
- `withWorkspaceRoute({ req, workspaceId, userId, role })`
- `BaseRepo` + `packages/repo`

### 2.4 المُستهلَك من Phase 04

- `@lifeos/security`: `generateNonce`, `buildCspHeader`, `assertCsrf`, `computeEventHash`, `assertOAuthState`
- `@lifeos/vault-crypto`: `sealEnvelope` / `openEnvelope` (لـ vault settings UI)
- `oauth_state_store` table
- `csrf_tokens` table
- `device_registry` table
- `audit_chain` (workspace_audit_events مع prev_hash/event_hash)
- `check-no-vault-leak.ts` CI gate (يجب أن يمر دائماً)

### 2.5 المُنتَج بعد Phase 05 (طبقة Auth/UI — وليس قفل الـ MVP)

- Zenith UI مُدمج بالكامل في `apps/web` (ليس clone خارجي)
- 6 auth pages + 3 settings pages + 5 auth routes
- 4 email templates × 2 locales (ar/en)
- `signInWithPassword` facade
- `withCsrfProtection` HOC
- 8 AppError codes جديدة → **التراكمي 38**
- 7 ADRs جديدة (0024..0030) → **التراكمي 21**
- 5 migrations 0200..0204 (المتاح لمراحل ما بعد MVP: 0205..0299)

## 3. خريطة الملفات

```jsx
apps/web/src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx                       (3.1) — public layout
│   │   ├── signin/page.tsx                  (3.2)
│   │   ├── signup/page.tsx                  (3.3)
│   │   └── reset/page.tsx                   (3.4)
│   ├── (settings)/
│   │   ├── layout.tsx                       (3.5) — auth-guarded layout
│   │   ├── security/page.tsx                (3.6)
│   │   ├── sessions/page.tsx                (3.7)
│   │   └── locale/page.tsx                  (3.8)
│   ├── api/v1/auth/
│   │   ├── signin/route.ts                  (3.9)
│   │   ├── signup/route.ts                  (3.10)
│   │   ├── signout/route.ts                 (3.11)
│   │   ├── oauth/callback/route.ts          (3.12)
│   │   └── reset/route.ts                   (3.13)
│   └── _hooks/use-session.ts                (3.14)
├── middleware.ts                            (3.15) — extended for auth + rate-limit
└── lib/get-session.ts                       (3.16)

packages/auth-ui/                            (4)
├── package.json
├── src/
│   ├── signin-form.tsx                      (4.1)
│   ├── signup-form.tsx                      (4.2)
│   ├── reset-form.tsx                       (4.3)
│   ├── password-strength.tsx                (4.4)
│   ├── captcha.tsx                          (4.5) — Cloudflare Turnstile stub
│   ├── locale-switcher.tsx                  (4.6)
│   └── index.ts                             (4.7)

packages/auth/                               (5) — extends Phase 02
├── src/
│   ├── sign-in-with-password.ts             (5.1) — جديد (facade)
│   ├── sign-up.ts                           (5.2) — جديد
│   ├── reset-password.ts                    (5.3) — جديد
│   └── (existing Phase 02 files unchanged)

packages/web-guards/                         (6) — جديد
├── package.json
├── src/
│   ├── with-csrf-protection.ts              (6.1)
│   ├── with-rate-limit.ts                   (6.2)
│   ├── require-session.ts                   (6.3)
│   └── index.ts                             (6.4)

packages/email/                              (7)
├── src/
│   ├── i18n.ts                              (7.1) — ICU + user.locale resolver
│   ├── render.ts                            (7.2) — MJML → HTML
│   ├── templates/
│   │   ├── welcome.ar.mjml                  (7.3)
│   │   ├── welcome.en.mjml                  (7.4)
│   │   ├── reset-password.ar.mjml           (7.5)
│   │   ├── reset-password.en.mjml           (7.6)
│   │   ├── magic-link.ar.mjml               (7.7)
│   │   ├── magic-link.en.mjml               (7.8)
│   │   ├── verify-email.ar.mjml             (7.9)
│   │   └── verify-email.en.mjml             (7.10)
│   └── index.ts                             (7.11)

scripts/
├── design-drift.ts                          (8.1) — مُحسَّن regex
└── zenith-merge-verify.ts                   (8.2) — يتحقق commit hash

packages/db/migrations/                      (9)
├── 0200__user_locale_column.sql
├── 0201__auth_rate_limit_extension.sql
├── 0202__email_templates_registry.sql
├── 0203__zenith_ui_preferences.sql
└── 0204__signin_attempts_audit_index.sql

docs/adr/                                    (10)
├── 0024__unified_phase_branch_tag_convention.md
├── 0025__zenith_in_place_merge_strategy.md
├── 0026__sign_in_with_password_facade.md
├── 0027__with_csrf_protection_hoc.md
├── 0028__i18n_strategy_icu_mjml_per_locale.md
├── 0029__auth_rate_limit_ip_email_composite.md
└── 0030__design_drift_regex_refinement.md

docs/execution/phase-05-outputs.md
docs/execution/auth-ui-layer-summary.md           ← نهاية الـ MVP
docs/runbooks/rollback-phase-05.md
```

## 4. Preflight

```bash
# 1. قفل المرحلة السابقة (Convention الموحَّد النهائي — ADR-0024)
git tag --list | grep -E '^phase-04-locked$'
# يجب أن تخرج: phase-04-locked

# 2. آخر migration = 0157 (Phase 04)
ls packages/db/migrations/ | tail -1
# يجب: 0157__lookup_public_share_fn.sql

# 3. توفر الـ exports
node -e "const s = require('@lifeos/shared'); console.log(typeof s.envelopeOk)"  # function
node -e "const g = require('@lifeos/auth-guard'); console.log(typeof g.verifyCsrf)"  # function
node -e "const sec = require('@lifeos/security'); console.log(typeof sec.assertOAuthState)"  # function

# 4. CI gates من المراحل السابقة
pnpm check:secrets   # Phase 04
pnpm typecheck       # كل المراحل

# 5. إنشاء الفرع
git checkout -b phase/05-zenith-ui-auth phase-04-locked

# 6. dependencies جديدة
pnpm add -w mjml @formatjs/icu-messageformat-parser intl-messageformat
pnpm add -w -D @types/mjml
```

**Convention guards (final — ADR-0024):**

- ❌ ممنوع نهائياً عبر كل المراحل: `wave/*` branches، `wNN-frozen` tags
- ✅ الالتزام النهائي: `phase/NN-short-name` + `phase-NN-locked` (annotated)

## 5. ADRs (7 جديدة)

### ADR-0024 — Unified phase branch/tag convention (final lockdown)

**القرار:** بعد ثلاث مراحل تكرر فيها الخطأ، نقفل الـ convention نهائياً:

- Branch: `phase/NN-short-name` (e.g. `phase/05-zenith-ui-auth`)
- Tag: `phase-NN-locked` (annotated, signed)
- `wave/*` و `wNN-frozen` محظورة في `.husky/pre-push` hook (يُضاف في هذه المرحلة)
- CI workflow `phase-convention.yml` يفشل عند اكتشاف أي branch/tag مخالف

**Pre-push hook content:**

```bash
# .husky/pre-push
#!/usr/bin/env sh
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if echo "$BRANCH" | grep -qE '^wave/'; then
	echo "ERROR: 'wave/*' branches are forbidden. Use 'phase/NN-name'. (ADR-0024)"
	exit 1
fi
```

### ADR-0025 — Zenith UI: in-place merge into apps/web

**القرار:** Zenith design system **يُدمج مباشرة في `apps/web/src/`** كملفات، ليس `git clone` خارجي ولا app منفصل.

**خطوات الدمج:**

1. `git remote add zenith https://github.com/imahmoudquotex-glitch/zenith-life-os-3a8f4fd8`
2. `git fetch zenith` ثم `git checkout zenith/main -- src/components src/styles tailwind.config.ts`
3. نقل الملفات إلى `apps/web/src/components/` و `apps/web/src/styles/`
4. **Pin commit hash** في `scripts/zenith-merge-verify.ts`: `ZENITH_COMMIT = '<actual-sha>'` (يُحدَّد عند التنفيذ).
5. `git remote remove zenith` — لا تبعية runtime.
6. الملفات تصبح part of monorepo، تخضع لـ typecheck/lint/design-drift.

**Fallback:** لو الـ repo حُذف بعد الدمج، الملفات بالفعل في monorepo — لا تأثير.

### ADR-0026 — `signInWithPassword` facade in @lifeos/auth

**القرار:** نُنشئ facade جديدة في `@lifeos/auth/src/sign-in-with-password.ts` تجمع `verifyPassword` + `createSession` + audit event + rate-limit increment في function واحدة. Phase 02 قدّمت اللبنات الأولية فقط (`hashPassword`, `verifyPassword`, `createSession`) دون composition.

### ADR-0027 — `withCsrfProtection` HOC pattern

**القرار:** كل route mutating (POST/PUT/PATCH/DELETE) يُلَفّ بـ `withCsrfProtection(...)` HOC. يستحيل نسيان `verifyCsrf` يدوياً.

### ADR-0028 — i18n: user.locale + ICU + per-template MJML

**القرار:**

- اللغة تُحدَّد من `users.locale` column (يُضاف في 0200).
- ICU MessageFormat عبر `intl-messageformat`.
- Email templates: ملف MJML منفصل لكل (template × locale)، لا `if/else` داخلية.
- UI strings: `messages/{ar,en}.json` يُحمَّل عبر Next.js `i18n` config.
- Locales المدعومة الآن: `ar`, `en`. إضافة locale جديد = إضافة ملفات بدون كود تغيير.

### ADR-0029 — Auth rate limiting: IP + email composite key

**القرار:**

- Bucket key = `auth:signin:{sha256(ip + ':' + email)}`
- حد: 5 محاولات فاشلة / 15 دقيقة
- Lockout: 1 ساعة بعد تجاوز الحد
- يُخزَّن في `rate_limit_buckets` (موجود من Phase 02)
- تُسجَّل محاولات الـ lockout في `workspace_audit_events` (مع `event_hash` كما في Phase 04)

### ADR-0030 — design-drift regex refinement

**القرار:** استبدال الـ string-match البدائي بـ regex دقيق + استثناءات directories:

- يُفحص `.tsx`/`.ts` فقط في `apps/web/src/components/**` و `packages/*/src/**`
- يُستثنى: `email/templates/**`, `**/*.svg`, `__fixtures__/**`, `*.test.*`
- forbidden patterns: `/className=["'][^"']*\\bbg-white\\b/`, `/\\blight:/` خارج comments

---

## 6. AppError codes الجديدة (8) — تراكمي 38

```tsx
// packages/shared/src/errors/phase-05-codes.ts
import type { ErrorCodeRegistry } from './registry';

declare module './registry' {
	interface ErrorCodeRegistry {
		AUTH_INVALID_CREDENTIALS: true;
		AUTH_RATE_LIMITED: true;
		AUTH_ACCOUNT_LOCKED: true;
		OAUTH_CALLBACK_FAILED: true;
		SESSION_REVOKED: true;
		LOCALE_NOT_SUPPORTED: true;
		CAPTCHA_REQUIRED: true;
		EMAIL_TEMPLATE_NOT_FOUND: true;
	}
}

export const PHASE_05_STATUS_MAP = {
	AUTH_INVALID_CREDENTIALS: 401,
	AUTH_RATE_LIMITED: 429,
	AUTH_ACCOUNT_LOCKED: 423,
	OAUTH_CALLBACK_FAILED: 400,
	SESSION_REVOKED: 401,
	LOCALE_NOT_SUPPORTED: 400,
	CAPTCHA_REQUIRED: 403,
	EMAIL_TEMPLATE_NOT_FOUND: 500,
} as const;
```

---

## Step 1 — packages/web-guards (HOC الجديدة)

### 6.1 `packages/web-guards/src/with-csrf-protection.ts`

```tsx
import type { NextRequest } from 'next/server';
import { verifyCsrf } from '@lifeos/auth-guard';
import { AppError, envelopeErr } from '@lifeos/shared';

type Handler = (req: NextRequest) => Promise<Response>;

export function withCsrfProtection(handler: Handler): Handler {
	return async (req) => {
		if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
			return handler(req);
		}
		const cookieToken = req.cookies.get('lifeos_csrf')?.value ?? '';
		const headerToken = req.headers.get('x-csrf-token') ?? '';
		if (!verifyCsrf({ cookieToken, bodyToken: headerToken })) {
			return Response.json(
				envelopeErr(new AppError('CSRF_TOKEN_INVALID', 'CSRF check failed.')),
				{ status: 403 },
			);
		}
		return handler(req);
	};
}
```

### 6.2 `packages/web-guards/src/with-rate-limit.ts`

```tsx
import type { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { AppError, envelopeErr, systemClock } from '@lifeos/shared';
import { db } from '@lifeos/db';

type RateLimitConfig = {
	bucketPrefix: string;        // e.g. 'auth:signin'
	maxAttempts: number;         // 5
	windowSeconds: number;       // 900 (15 min)
	lockoutSeconds: number;      // 3600 (1 hour)
	keyFn: (req: NextRequest, body: unknown) => string;  // returns 'ip:email'
};

export function withRateLimit(cfg: RateLimitConfig) {
	return (handler: (req: NextRequest, body: any) => Promise<Response>) => async (req: NextRequest) => {
		const body = await req.clone().json().catch(() => ({}));
		const rawKey = cfg.keyFn(req, body);
		const bucketKey = `${cfg.bucketPrefix}:${createHash('sha256').update(rawKey).digest('hex')}`;
		const now = systemClock.nowMs();

		const bucket = await db.oneOrNone<{ attempts: number; locked_until_ms: number | null }>(
			`SELECT attempts, locked_until_ms FROM rate_limit_buckets
			   WHERE bucket_key = $1 FOR UPDATE`,
			[bucketKey],
		);

		if (bucket?.locked_until_ms && bucket.locked_until_ms > now) {
			return Response.json(
				envelopeErr(new AppError('AUTH_ACCOUNT_LOCKED', 'Too many attempts. Try later.')),
				{ status: 423, headers: { 'Retry-After': String(Math.ceil((bucket.locked_until_ms - now) / 1000)) } },
			);
		}

		const res = await handler(req, body);

		if (res.status >= 400 && res.status !== 423) {
			const nextAttempts = (bucket?.attempts ?? 0) + 1;
			const lockedUntil = nextAttempts >= cfg.maxAttempts ? now + cfg.lockoutSeconds * 1000 : null;
			await db.none(
				`INSERT INTO rate_limit_buckets (bucket_key, attempts, window_start_ms, locked_until_ms)
				   VALUES ($1, 1, $2, $3)
				 ON CONFLICT (bucket_key) DO UPDATE
				   SET attempts = rate_limit_buckets.attempts + 1,
				       locked_until_ms = $3`,
				[bucketKey, now, lockedUntil],
			);
		} else if (res.status < 400) {
			await db.none(`DELETE FROM rate_limit_buckets WHERE bucket_key = $1`, [bucketKey]);
		}

		return res;
	};
}
```

### 6.3 `packages/web-guards/src/require-session.ts`

```tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateSession } from '@lifeos/auth';

export async function requireSession() {
	const sid = cookies().get('lifeos_sid')?.value;
	if (!sid) redirect('/signin');
	const session = await validateSession(sid);
	if (!session) redirect('/signin?error=session_invalid');
	return session;
}
```

### 6.4 `packages/web-guards/src/index.ts`

```tsx
export * from './with-csrf-protection';
export * from './with-rate-limit';
export * from './require-session';
```

---

## Step 2 — packages/auth (facades جديدة)

### 5.1 `packages/auth/src/sign-in-with-password.ts` (جديد — ADR-0026)

```tsx
import { db } from '@lifeos/db';
import { AppError, systemClock } from '@lifeos/shared';
import { computeEventHash } from '@lifeos/security';
import { verifyPassword } from './password';
import { createSession } from './session';

export type SignInResult = {
	sessionId: string;
	userId: string;
	workspaceId: string;
	locale: string;
};

export async function signInWithPassword(
	email: string,
	password: string,
	deviceFingerprint: string,
	userAgent: string,
): Promise<SignInResult> {
	const user = await db.oneOrNone<{
		id: string;
		workspace_id: string;
		password_hash: string;
		locale: string;
		locked_at: Date | null;
	}>(
		`SELECT id, workspace_id, password_hash, locale, locked_at
		   FROM users WHERE email = $1 AND is_deleted = false`,
		[email.toLowerCase()],
	);
	if (!user) throw new AppError('AUTH_INVALID_CREDENTIALS', 'Invalid credentials.');
	if (user.locked_at) throw new AppError('AUTH_ACCOUNT_LOCKED', 'Account locked.');

	const ok = await verifyPassword(password, user.password_hash);
	if (!ok) throw new AppError('AUTH_INVALID_CREDENTIALS', 'Invalid credentials.');

	const session = await createSession({
		userId: user.id,
		workspaceId: user.workspace_id,
		deviceFingerprint,
		userAgent,
	});

	// Audit event with hash chain (Phase 04 ADR-0019)
	const occurredAt = new Date(systemClock.nowMs()).toISOString();
	const prev = await db.oneOrNone<{ event_hash: string }>(
		`SELECT event_hash FROM workspace_audit_events
		   WHERE workspace_id = $1 ORDER BY occurred_at DESC LIMIT 1`,
		[user.workspace_id],
	);
	const prevHash = prev?.event_hash ?? '0'.repeat(64);
	const evInput = {
		workspaceId: user.workspace_id,
		actorId: user.id,
		eventType: 'auth.signin.success',
		payload: { sessionId: session.id, deviceFingerprint },
		occurredAt,
	};
	const eventHash = computeEventHash(prevHash, evInput);
	await db.none(
		`INSERT INTO workspace_audit_events
		   (workspace_id, actor_id, event_type, payload, occurred_at, prev_hash, event_hash)
		 VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)`,
		[user.workspace_id, user.id, evInput.eventType, JSON.stringify(evInput.payload), occurredAt, prevHash, eventHash],
	);

	return { sessionId: session.id, userId: user.id, workspaceId: user.workspace_id, locale: user.locale };
}
```

---

## Step 3 — Auth route: signin (مع كل الإصلاحات)

### 3.9 `apps/web/src/app/api/v1/auth/signin/route.ts`

```tsx
import { NextRequest } from 'next/server';
import { envelopeOk, envelopeErr, AppError } from '@lifeos/shared';
import { signInWithPassword } from '@lifeos/auth';
import { withCsrfProtection, withRateLimit } from '@lifeos/web-guards';

const handler = async (req: NextRequest, body: { email: string; password: string }) => {
	try {
		const ua = req.headers.get('user-agent') ?? '';
		const fp = req.headers.get('x-device-fingerprint') ?? 'unknown';
		const result = await signInWithPassword(body.email, body.password, fp, ua);

		const res = Response.json(envelopeOk({ redirectTo: '/', locale: result.locale }), { status: 200 });
		res.headers.append('Set-Cookie',
			`lifeos_sid=${result.sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 3600}`);
		return res;
	} catch (e) {
		if (e instanceof AppError) {
			return Response.json(envelopeErr(e), { status: e.statusCode });
		}
		throw e;
	}
};

export const POST = withCsrfProtection(
	withRateLimit({
		bucketPrefix: 'auth:signin',
		maxAttempts: 5,
		windowSeconds: 900,
		lockoutSeconds: 3600,
		keyFn: (req, body: any) => {
			const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
			const email = (body?.email ?? '').toLowerCase();
			return `${ip}:${email}`;
		},
	})(handler),
);
```

**التحقق من الإصلاحات:**

- ✅ `envelopeOk` (ليس `okEnvelope`)
- ✅ `withCsrfProtection` HOC بدل `verifyCsrf` يدوي
- ✅ `withRateLimit` على IP+email composite key
- ✅ `signInWithPassword` facade من `@lifeos/auth`

### 3.12 OAuth callback مع error handling (ADR-0027 + Phase 04 ADR-0020)

```tsx
// apps/web/src/app/api/v1/auth/oauth/callback/route.ts
import { NextRequest } from 'next/server';
import { assertOAuthState } from '@lifeos/security';
import { db } from '@lifeos/db';
import { systemClock } from '@lifeos/shared';

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const state = searchParams.get('state') ?? '';
	const code = searchParams.get('code') ?? '';

	// Verify and consume state (with error handling per review fix #4)
	try {
		const stored = await db.oneOrNone<{ state: string; expires_at: Date; consumed_at: Date | null }>(
			`SELECT state, expires_at, consumed_at FROM oauth_state_store
			   WHERE state = $1 FOR UPDATE`,
			[state],
		);
		if (stored?.consumed_at) {
			return Response.redirect(new URL('/signin?error=oauth_state_replay', req.url));
		}
		assertOAuthState(stored, state, new Date(systemClock.nowMs()));
		await db.none(`UPDATE oauth_state_store SET consumed_at = now() WHERE state = $1`, [state]);
	} catch {
		return Response.redirect(new URL('/signin?error=oauth_state_invalid', req.url));
	}

	// ... exchange code for tokens, create session ...
	return Response.redirect(new URL('/', req.url));
}
```

---

## Step 4 — Settings layout (auth guard)

### 3.5 `apps/web/src/app/(settings)/layout.tsx`

```tsx
import { requireSession } from '@lifeos/web-guards';
import { ReactNode } from 'react';

export default async function SettingsLayout({ children }: { children: ReactNode }) {
	await requireSession();  // redirects to /signin if missing/invalid
	return <div className="settings-shell">{children}</div>;
}
```

أي صفحة تحت `app/(settings)/**` محمية تلقائياً.

---

## Step 5 — SigninForm (مع كل الإصلاحات)

### 4.1 `packages/auth-ui/src/signin-form.tsx`

```tsx
'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordStrength } from './password-strength';

type Props = { csrfToken: string };

export function SigninForm({ csrfToken }: Props) {
	const router = useRouter();
	const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [password, setPassword] = useState('');

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setStatus('submitting');
		setErrorMsg(null);
		const data = new FormData(e.currentTarget);
		const res = await fetch('/api/v1/auth/signin', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-csrf-token': csrfToken,
			},
			body: JSON.stringify({
				email: data.get('email'),
				password: data.get('password'),
			}),
		});
		const json = await res.json();
		if (!res.ok) {
			setStatus('error');
			setErrorMsg(json?.error?.message ?? 'Sign-in failed');
			return;
		}
		router.replace(json.data.redirectTo ?? '/');  // ← لا window.location.href
	}

	return (
		<form onSubmit={handleSubmit} aria-busy={status === 'submitting'} className="space-y-4">
			<input name="email" type="email" required autoComplete="email" className="input" />
			<input
				name="password"
				type="password"
				required
				autoComplete="current-password"
				className="input"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
			/>
			<PasswordStrength password={password} />
			{errorMsg && <p role="alert" className="text-red-400">{errorMsg}</p>}
			<button type="submit" disabled={status === 'submitting'} className="btn-primary">
				Sign in
			</button>
		</form>
	);
}
```

**التحقق من الإصلاحات:**

- ✅ `onSubmit` handler (ليس `form action`)
- ✅ `useRouter().replace()` (ليس `window.location.href`)
- ✅ `e.preventDefault()` صريح

### 4.4 `packages/auth-ui/src/password-strength.tsx` (مع color classes)

```tsx
'use client';

const RULES = [
	{ test: (p: string) => p.length >= 8, label: '8+ chars' },
	{ test: (p: string) => /[A-Z]/.test(p), label: 'Uppercase' },
	{ test: (p: string) => /[a-z]/.test(p), label: 'Lowercase' },
	{ test: (p: string) => /[0-9]/.test(p), label: 'Number' },
	{ test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Symbol' },
];

const WIDTHS = ['w-0', 'w-1/5', 'w-2/5', 'w-3/5', 'w-4/5', 'w-full'];
const COLORS = ['bg-transparent', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-emerald-500'];

export function PasswordStrength({ password }: { password: string }) {
	const passed = RULES.filter(r => r.test(password)).length;
	const widthClass = WIDTHS[passed] ?? 'w-0';
	const colorClass = COLORS[passed] ?? 'bg-transparent';
	return (
		<div className="space-y-1" aria-live="polite">
			<div className="h-1 bg-zinc-800 rounded overflow-hidden">
				<div className={`h-1 rounded transition-all ${widthClass} ${colorClass}`} aria-hidden />
			</div>
			<p className="text-xs text-zinc-400">{passed}/5 requirements met</p>
		</div>
	);
}
```

### 4.5 `packages/auth-ui/src/captcha.tsx` (محتوى كامل — Turnstile)

```tsx
'use client';
import { useEffect, useRef } from 'react';

type Props = {
	siteKey: string;          // Cloudflare Turnstile site key from ServerEnv
	onToken: (token: string) => void;
	onError?: () => void;
};

/**
 * Cloudflare Turnstile widget.
 * Provider chosen for privacy (no Google), free tier, no UX friction.
 * Server verification happens in route via TURNSTILE_SECRET (ServerEnv).
 */
export function Captcha({ siteKey, onToken, onError }: Props) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const script = document.createElement('script');
		script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
		script.async = true;
		script.defer = true;
		document.head.appendChild(script);

		const handle = setInterval(() => {
			const w = (window as any).turnstile;
			if (!w || !ref.current) return;
			clearInterval(handle);
			w.render(ref.current, {
				sitekey: siteKey,
				callback: (token: string) => onToken(token),
				'error-callback': () => onError?.(),
			});
		}, 100);

		return () => { clearInterval(handle); document.head.removeChild(script); };
	}, [siteKey, onToken, onError]);

	return <div ref={ref} data-testid="turnstile-widget" />;
}
```

---

## Step 6 — Email i18n strategy (ADR-0028)

### 7.1 `packages/email/src/i18n.ts`

```tsx
import IntlMessageFormat from 'intl-messageformat';

export type SupportedLocale = 'ar' | 'en';
export const SUPPORTED_LOCALES: SupportedLocale[] = ['ar', 'en'];

export function isSupported(loc: string): loc is SupportedLocale {
	return (SUPPORTED_LOCALES as string[]).includes(loc);
}

export function format(messageTemplate: string, values: Record<string, string | number>, locale: SupportedLocale): string {
	return new IntlMessageFormat(messageTemplate, locale).format(values) as string;
}
```

### 7.2 `packages/email/src/render.ts`

```tsx
import mjml2html from 'mjml';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppError } from '@lifeos/shared';
import { format, isSupported, SupportedLocale } from './i18n';

const TEMPLATES_DIR = join(__dirname, 'templates');

export function renderEmail(
	templateName: 'welcome' | 'reset-password' | 'magic-link' | 'verify-email',
	locale: string,
	vars: Record<string, string | number>,
): { subject: string; html: string } {
	if (!isSupported(locale)) {
		throw new AppError('LOCALE_NOT_SUPPORTED', `Locale ${locale} not supported.`);
	}
	const file = join(TEMPLATES_DIR, `${templateName}.${locale}.mjml`);
	let mjmlSource: string;
	try {
		mjmlSource = readFileSync(file, 'utf-8');
	} catch {
		throw new AppError('EMAIL_TEMPLATE_NOT_FOUND', `Template ${templateName}.${locale} missing.`);
	}
	const subjectMatch = mjmlSource.match(/<!--\s*subject:\s*(.+?)\s*-->/);
	const subject = format(subjectMatch?.[1] ?? templateName, vars, locale as SupportedLocale);
	const rendered = format(mjmlSource, vars, locale as SupportedLocale);
	const { html, errors } = mjml2html(rendered, { validationLevel: 'strict' });
	if (errors.length > 0) {
		throw new AppError('EMAIL_TEMPLATE_NOT_FOUND', `MJML compile errors: ${errors.map(e => e.message).join(', ')}`);
	}
	return { subject, html };
}
```

Example MJML template `welcome.ar.mjml`:

```xml
<!-- subject: مرحباً بك في LifeOS، {name} -->
<mjml>
	<mj-head>
		<mj-attributes>
			<mj-all font-family="Tahoma, Arial" />
		</mj-attributes>
	</mj-head>
	<mj-body background-color="#0a0a0a">
		<mj-section>
			<mj-column>
				<mj-text color="#ffffff" font-size="20px" align="right">مرحباً {name} 👋</mj-text>
				<mj-text color="#a1a1aa" align="right">حسابك جاهز. ابدأ من هنا:</mj-text>
				<mj-button background-color="#7c3aed" href="{ctaUrl}">افتح LifeOS</mj-button>
			</mj-column>
		</mj-section>
	</mj-body>
</mjml>
```

---

## Step 7 — Migrations (0200..0204)

### 0200 `user_locale_column.sql`

```sql
BEGIN;

ALTER TABLE users
	ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'en'
		CHECK (locale IN ('ar', 'en'));

CREATE INDEX IF NOT EXISTS idx_users_locale ON users(locale);

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0200', '05', now());

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_users_locale;
-- ALTER TABLE users DROP COLUMN IF EXISTS locale;
-- DELETE FROM schema_migrations WHERE version='0200';
-- COMMIT;
```

### 0201 `auth_rate_limit_extension.sql`

```sql
BEGIN;

ALTER TABLE rate_limit_buckets
	ADD COLUMN IF NOT EXISTS bucket_kind TEXT NOT NULL DEFAULT 'generic'
		CHECK (bucket_kind IN ('generic', 'auth_signin', 'auth_signup', 'auth_reset', 'auth_oauth'));

CREATE INDEX IF NOT EXISTS idx_rate_limit_kind_locked
	ON rate_limit_buckets(bucket_kind, locked_until_ms)
	WHERE locked_until_ms IS NOT NULL;

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0201', '05', now());

COMMIT;

-- ROLLBACK:
-- ALTER TABLE rate_limit_buckets DROP COLUMN IF EXISTS bucket_kind;
-- DROP INDEX IF EXISTS idx_rate_limit_kind_locked;
```

### 0202 `email_templates_registry.sql`

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS email_templates_registry (
	name TEXT NOT NULL,
	locale TEXT NOT NULL,
	version INTEGER NOT NULL DEFAULT 1,
	active BOOLEAN NOT NULL DEFAULT true,
	registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	PRIMARY KEY (name, locale)
);

INSERT INTO email_templates_registry (name, locale) VALUES
	('welcome', 'ar'), ('welcome', 'en'),
	('reset-password', 'ar'), ('reset-password', 'en'),
	('magic-link', 'ar'), ('magic-link', 'en'),
	('verify-email', 'ar'), ('verify-email', 'en')
ON CONFLICT (name, locale) DO NOTHING;

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0202', '05', now());

COMMIT;

-- ROLLBACK: DROP TABLE IF EXISTS email_templates_registry;
```

### 0203 `zenith_ui_preferences.sql`

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS zenith_ui_preferences (
	user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
	workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme = 'dark'),  -- only dark in MVP
	accent_color TEXT NOT NULL DEFAULT 'violet'
		CHECK (accent_color IN ('violet', 'cyan', 'emerald', 'rose', 'amber')),
	reduce_motion BOOLEAN NOT NULL DEFAULT false,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE zenith_ui_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE zenith_ui_preferences FORCE ROW LEVEL SECURITY;
CREATE POLICY zenith_ui_self ON zenith_ui_preferences FOR ALL
	USING (
		user_id = current_setting('app.user_id', true)::uuid
		AND workspace_id = current_setting('app.workspace_id', true)::uuid
	);

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0203', '05', now());

COMMIT;

-- ROLLBACK: DROP TABLE IF EXISTS zenith_ui_preferences;
```

### 0204 `signin_attempts_audit_index.sql`

```sql
BEGIN;

CREATE INDEX IF NOT EXISTS idx_audit_signin_failures
	ON workspace_audit_events(workspace_id, occurred_at DESC)
	WHERE event_type = 'auth.signin.failure';

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0204', '05', now());

COMMIT;

-- ROLLBACK: DROP INDEX IF EXISTS idx_audit_signin_failures;
```

---

## Step 8 — design-drift script (مُحسَّن — ADR-0030)

### 8.1 `scripts/design-drift.ts`

```tsx
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const INCLUDED_GLOBS = [/^apps\/web\/src\/components\//, /^packages\/[^/]+\/src\//];
const EXCLUDED = [
	/packages\/email\/src\/templates\//,
	/\.svg$/i,
	/__fixtures__\//,
	/\.test\.[tj]sx?$/,
	/\.stories\.[tj]sx?$/,
];

const FORBIDDEN: { name: string; re: RegExp }[] = [
	{ name: 'JSX_BG_WHITE', re: /className=["'][^"']*\bbg-white\b/g },
	{ name: 'JSX_TEXT_BLACK', re: /className=["'][^"']*\btext-black\b/g },
	{ name: 'TW_LIGHT_VARIANT', re: /(?<![/\*])\blight:/g },
];

function walk(dir: string, acc: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		if (['node_modules', '.next', '.git', 'dist', 'coverage'].includes(name)) continue;
		const full = join(dir, name);
		const st = statSync(full);
		if (st.isDirectory()) walk(full, acc);
		else if (/\.(ts|tsx)$/.test(name)) acc.push(full);
	}
	return acc;
}

const hits: string[] = [];
for (const file of walk(ROOT)) {
	const rel = relative(ROOT, file);
	if (!INCLUDED_GLOBS.some(re => re.test(rel))) continue;
	if (EXCLUDED.some(re => re.test(rel))) continue;
	const text = readFileSync(file, 'utf-8');
	for (const p of FORBIDDEN) {
		const m = text.match(p.re);
		if (m) hits.push(`${rel}: ${p.name} (${m.length})`);
	}
}

if (hits.length > 0) {
	console.error('Design drift FAILED:');
	for (const h of hits) console.error('  - ' + h);
	process.exit(1);
}
console.log('Design drift: OK');
```

يُضاف لـ `package.json`:

```json
"check:design": "tsx scripts/design-drift.ts"
```

---

## Step 9 — checklist التنفيذ

- [ ]  **Preflight**: `phase-04-locked` موجود، آخر migration = 0157
- [ ]  `pnpm add -w mjml @formatjs/icu-messageformat-parser intl-messageformat`
- [ ]  إنشاء `packages/web-guards` (with-csrf-protection, with-rate-limit, require-session)
- [ ]  إضافة `signInWithPassword`, `signUp`, `resetPassword` في `packages/auth/src/`
- [ ]  إنشاء `packages/auth-ui` (signin/signup/reset forms + password-strength + captcha + locale-switcher)
- [ ]  إنشاء `packages/email` (i18n + render + 8 MJML templates)
- [ ]  Zenith merge: `git remote add zenith ...`، `git fetch`، نقل `src/components` و `src/styles` لـ `apps/web/src/`، pin commit hash في `scripts/zenith-merge-verify.ts`
- [ ]  إنشاء auth routes الـ 5 في `apps/web/src/app/api/v1/auth/`
- [ ]  إنشاء auth pages الـ 3 + settings pages الـ 3 + `(settings)/layout.tsx`
- [ ]  تطبيق migrations 0200..0204
- [ ]  إضافة 8 AppError codes
- [ ]  كتابة `.husky/pre-push` hook + `.github/workflows/phase-convention.yml`
- [ ]  تشغيل `pnpm typecheck && pnpm test && pnpm check:secrets && pnpm check:design`
- [ ]  pgTAP لـ `zenith_ui_preferences` RLS
- [ ]  تحديث `.env.example`: `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET`, `DEFAULT_LOCALE=en`
- [ ]  كتابة `phase-05-outputs.md` + `auth-ui-layer-summary.md` + `rollback-phase-05.md`
- [ ]  `git tag -a phase-05-locked -m "Phase 05 V1.1 — Auth/UI layer locked (MVP not yet closed)"`

---

## Step 10 — Definition of Done

1. ✅ 7 ADRs جديدة (0024..0030)
2. ✅ 8 AppError codes عبر declaration merging → تراكمي 38
3. ✅ 2 packages جديدة (`@lifeos/web-guards`, `@lifeos/auth-ui`) + توسعة 2 (`@lifeos/auth`, `@lifeos/email`)
4. ✅ 5 migrations 0200..0204
5. ✅ Zenith UI مُدمج in-place في `apps/web/src/` مع commit hash مُثبَّت
6. ✅ 5 auth routes كلها ملفوفة بـ `withCsrfProtection` + `withRateLimit` (signin/signup/reset)
7. ✅ `(settings)/layout.tsx` يستدعي `requireSession`
8. ✅ كل forms تستخدم `onSubmit` handler + `useRouter().replace()` (لا `form action`, لا `window.location.href`)
9. ✅ كل routes تستخدم `envelopeOk` (verified by typecheck — `okEnvelope` لا يوجد كـ export)
10. ✅ Email templates: 4 templates × 2 locales = 8 ملفات MJML، rendering عبر ICU
11. ✅ `pnpm check:design` يمر مع regex المُحسَّن (لا false positives على email-templates/svg)
12. ✅ `pnpm check:secrets` يمر (Phase 04 gate)
13. ✅ `.husky/pre-push` يمنع `wave/*` branches
14. ✅ `git tag -l phase-05-locked` يخرج النتيجة
15. ✅ Auth/UI layer summary مكتوبة — والـ MVP **ليس** مُقفَلاً (5 features من قائمة الـ 15 لم تُنفَّذ بعد)

---

## Step 11 — سجل القرارات (D-068..D-080)

| المعرف | القرار | المرحلة |
| --- | --- | --- |
| D-068 | Branch/tag convention مقفل نهائياً عبر pre-push hook + CI (ADR-0024) | 05 |
| D-069 | Zenith UI in-place merge في apps/web — لا clone خارجي ولا app منفصل (ADR-0025) | 05 |
| D-070 | `signInWithPassword` facade في `@lifeos/auth` يجمع verifyPassword+createSession+audit (ADR-0026) | 05 |
| D-071 | `withCsrfProtection` HOC إلزامي على كل mutating route (ADR-0027) | 05 |
| D-072 | i18n: `users.locale`  • ICU + per-template MJML (ADR-0028) | 05 |
| D-073 | Auth rate limit: IP+email composite SHA-256، 5/15min، lockout 1h (ADR-0029) | 05 |
| D-074 | `design-drift` regex مُحسَّن مع excluded directories (ADR-0030) | 05 |
| D-075 | كل forms client تستخدم `onSubmit` handler + `e.preventDefault()` — لا `form action` | 05 |
| D-076 | Navigation post-auth: `useRouter().replace()` — لا `window.location.href` | 05 |
| D-077 | OAuth callback errors تُعاد كـ redirect مع query param `?error=...` (ليس throw) | 05 |
| D-078 | Settings group محمي بـ `requireSession()` في layout.tsx | 05 |
| D-079 | Captcha provider: Cloudflare Turnstile (privacy + free tier) | 05 |
| D-080 | Password strength: 5 rules مع color-coded bar (red→emerald) | 05 |

---

## Step 12 — [phase-05-outputs.md](http://phase-05-outputs.md)

```markdown
# Phase 05 Outputs (V1.1) — Auth/UI Layer Complete (MVP NOT yet closed)

## A. Migrations Applied
0200..0204 (5 migrations). schema_migrations rows = 5 with phase='05'.
**Next available migration number: 0205.**
**Phase 05 reserved range: 0200..0299 (used 0200..0204). From Phase 06 onward, every phase uses a strict 100-slot reservation (D-012): P06=0300..0399, P07=0400..0499, ..., P(NN) = ((NN-6)*100+300)..((NN-6)*100+399).**

## B. New Workspace Packages
- `@lifeos/web-guards` (withCsrfProtection, withRateLimit, requireSession)
- `@lifeos/auth-ui` (forms + password-strength + captcha + locale-switcher)

## C. Extended Packages
- `@lifeos/auth`: +signInWithPassword, +signUp, +resetPassword
- `@lifeos/email`: +i18n.ts, +render.ts, +8 MJML templates

## D. New AppError Codes (8) — cumulative 38
AUTH_INVALID_CREDENTIALS (401), AUTH_RATE_LIMITED (429), AUTH_ACCOUNT_LOCKED (423),
OAUTH_CALLBACK_FAILED (400), SESSION_REVOKED (401), LOCALE_NOT_SUPPORTED (400),
CAPTCHA_REQUIRED (403), EMAIL_TEMPLATE_NOT_FOUND (500).

## E. New ADRs (7) — cumulative 21
0024..0030 (convention lockdown, Zenith merge, facades, HOC, i18n, rate-limit, design-drift)

## F. CI Gates (cumulative)
- `pnpm typecheck` (all phases)
- `pnpm test` (all phases, incl pgTAP)
- `pnpm check:secrets` (Phase 04)
- `pnpm check:design` (Phase 05)
- `.husky/pre-push` enforces phase/* branch naming (Phase 05)
- `.github/workflows/phase-convention.yml` enforces tag naming (Phase 05)

## G. Conventions binding for post-MVP
- Use `envelopeOk` from `@lifeos/shared` (NEVER `okEnvelope`)
- Wrap every mutating route with `withCsrfProtection` (+ `withRateLimit` for auth)
- Settings/protected pages: use `(group)/layout.tsx` calling `requireSession()`
- Client forms: `onSubmit={async (e) => { e.preventDefault(); ... }}` + `useRouter().replace()`
- New email templates: add MJML file per locale, register in `email_templates_registry`
- New AppError codes: declaration merging on `ErrorCodeRegistry`
- New migrations: continue 0205..0299 then increment range
```

## Step 13 — [auth-ui-layer-summary.md](http://auth-ui-layer-summary.md) (نهاية الـ MVP)

```markdown
# LifeOS Auth/UI Layer Summary (after Phase 05) — MVP NOT closed

## Total artifacts
- **Migrations:** 200+ (0001..0204) across phases 02..05
- **AppError codes:** 38
- **ADRs:** 21 (0001..0030, minus a few reserved slots)
- **Workspace packages:** 13+
  - shared, db, auth, auth-guard, permissions, repo,
    vault-crypto, security, offline, web-guards, auth-ui, email, web
- **CI gates:** typecheck + test (pgTAP + vitest) + check:secrets + check:design + phase-convention

## Capabilities delivered
1. Multi-tenant DB with RLS + audit hash chain
2. Auth: password + OAuth (PKCE+state) + magic-link + email verify
3. Vault: client-side XChaCha20-Poly1305 + Argon2id envelope encryption
4. Offline: outbox + body-hash integrity + exponential backoff
5. Security: strict CSP + nonce + CSRF HOC + secret scanner CI
6. i18n: ar/en across UI + 4 email templates
7. Rate limiting: composite IP+email, lockout, audit-trail
8. Tasks/Notes/Habits/Expenses/Calendar/AI-quota services with repo pattern

## Remaining MVP work BEFORE launch (still required — not delivered by Phase 05)

The 15 MVP feature keys locked in Phase 00 `mvp-scope.md` are NOT all delivered. Phases 06+ MUST implement before MVP can close:
- `dashboard` (daily command center) — target Phase 06
- `ai-gateway` (`@lifeos/ai` safe AI usage) — target Phase 06
- `goals` (set & track outcomes) — target Phase 15
- `calendar` (time-bound items UI) — target Phase 16
- `search` (fast retrieval) — target Phase 37
- Rich UI for `pages/notes/tasks` (Phase 02/03 built only data plane) — target Phases 09–12

MVP closure happens only after all 15 features pass their metric gates in `launch-criteria.md`. Phase 05 closes the **Auth/UI layer**, not the MVP.

## Ready for post-Phase-05 phases (06+)
- Migration range: 0205..0299
- ADR range: 0031+
- Reserved AppError codes: define via ErrorCodeRegistry
- All conventions documented & enforced in CI
```

---

## Step 14 — ملاحظات للـ Executor

1. **Preflight first** — لا تتجاوز أي guard.
2. **packages بالترتيب**: web-guards → auth (facades) → auth-ui → email → routes/pages.
3. **Zenith merge**:
    - `git remote add zenith https://github.com/imahmoudquotex-glitch/zenith-life-os-3a8f4fd8`
    - `git fetch zenith` ثم `git log zenith/main -1 --format=%H` → سجل الـ SHA في `scripts/zenith-merge-verify.ts` كـ `ZENITH_COMMIT`
    - `git checkout zenith/main -- src/components src/styles tailwind.config.ts`
    - نقل/دمج الملفات في `apps/web/src/components/` و `apps/web/src/styles/`
    - `git remote remove zenith`
4. **لا تستخدم `okEnvelope` أبداً** — استخدم `envelopeOk` (typecheck سيكتشف ذلك).
5. **لا تكتب `verifyCsrf` يدوياً داخل route** — لف الـ route بـ `withCsrfProtection`.
6. **لا تستخدم `form action={fn}`** — استخدم `onSubmit={async (e) => { e.preventDefault(); ... }}`.
7. **لا تستخدم `window.location.href`** — استخدم `useRouter().replace()`.
8. **OAuth callback errors**: redirect مع `?error=...` ، ليس throw.
9. **Settings layout** يجب أن يستدعي `requireSession()` — لا تتركها لكل page.
10. **`git tag -a phase-05-locked`** عند الانتهاء.

---

*نهاية مرحلة 5. طبقة Auth/UI مُكتملة. الـ MVP ليس مُقفلاً — يبقى dashboard, goals, calendar, search, ai-gateway + UI extensions في Phases 06..16+ قبل الـ launch.*