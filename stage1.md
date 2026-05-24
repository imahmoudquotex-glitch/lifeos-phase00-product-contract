# Phase 01 — Architecture Contracts & Naming Freeze

<aside>
🎯

**هدف المرحلة:** تجميد كل التعاقدات المعمارية + إنشاء `@lifeos/shared` و `@lifeos/result` و `@lifeos/db` و `@lifeos/route` و 14 CI guard. الناتج النهائي = monorepo جاهز و tag `phase-01-locked`. لا UI، لا migrations فعلية، لا AI، لا auth.

</aside>

<aside>
🤖

**رسالة للـ AI Executor:** اقرأ هذه الصفحة + `docs/governance/global-conventions.md` (المكتوب في Phase 00). أي تعارض → الـ Global Conventions يفوز. لا تستخدم `pg` أو `pg-promise` مباشرةً. لا تستخدم أسماء imports مثل `packages/shared` — استخدم `@lifeos/shared` فقط.

</aside>

## 0. Preflight (Gate من Phase 00)

📌 **قبل أي ملف:**

- [ ]  `git tag --list | grep -x phase-00-product-contract-locked` يخرج بـ exit 0.
- [ ]  `test -f docs/execution/phase-00-outputs.md` يخرج بـ exit 0 (Inter-phase contract من Phase 00).
- [ ]  `docs/governance/global-conventions.md` موجود (من Phase 00 — Sections 1–22 تشمل Branches/Tags + Inter-phase Outputs + Secrets + Rollback).
- [ ]  `docs/execution/phase-00-decisions-log.md` موجود بصفوف D-001…D-011 (من Phase 00).
- [ ]  `test -f vitest.config.ts` يخرج بـ exit 0 (أُنشئ في Phase 00 Step 21؛ Phase 01 يوسّعه).
- [ ]  `node -v` ≥ v20.11.0.
- [ ]  `corepack enable && corepack prepare pnpm@9.0.0 --activate` تم تشغيله.
- [ ]  افتح branch: `phase/01-architecture` (التسمية الموحدة لكل الـ 60 مرحلة: `phase/NN-short-name`).
- [ ]  لا توجد ملفات `package.json` في الجذر بعد.

## 1. ملخص المرحلة

Phase 01 = العمود الفقري الهندسي. الناتج:

- Monorepo بـ pnpm workspaces + turbo.
- 4 packages أساسية: `@lifeos/shared`, `@lifeos/result`, `@lifeos/db`, `@lifeos/route`.
- 2 apps skeleton: `@lifeos/app-web` (Next.js 14)، `@lifeos/app-worker` (placeholder).
- 14 CI guard scripts (`scripts/check-*.ts`).
- 4 ADRs أساسية (`docs/adr/0001..0004`).
- 6 architecture docs (`docs/architecture/*.md`).
- GitHub Actions workflow.
- Husky pre-commit + commit-msg.
- git tag `phase-01-locked` عند الانتهاء.
- `.env.example` في الجذر (يوثّق كل env vars المطلوبة).
- `docs/runbooks/rollback.md` (rollback strategy لـ 60 مرحلة).
- `docs/execution/phase-01-outputs.md` (Inter-phase contract → Phase 02).

## 2. خريطة الملفات النهائية

```
.
├── .nvmrc                          (v20.11.0)
├── .npmrc
├── .editorconfig
├── .gitignore
├── .gitattributes
├── .prettierrc.json
├── .prettierignore
├── .eslintrc.cjs
├── .eslintignore
├── package.json                    (root, private, workspace manager)
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── tsconfig.json                   (composite, references all packages)
├── vitest.config.ts
├── commitlint.config.cjs
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── .github/
│   ├── workflows/ci.yml
│   ├── pull_request_template.md
│   └── ISSUE_TEMPLATE/bug_report.md
├── .env.example                    (V1.2: documented env vars; never committed with real secrets)
├── docs/
│   ├── adr/
│   │   ├── 0001-monorepo-tooling.md
│   │   ├── 0002-naming-conventions.md
│   │   ├── 0003-db-client-interface.md
│   │   └── 0004-error-and-result.md
│   ├── architecture/
│   │   ├── overview.md
│   │   ├── package-map.md
│   │   ├── error-model.md
│   │   ├── id-generation.md
│   │   ├── money-and-time.md
│   │   └── api-envelope.md
│   ├── runbooks/
│   │   └── rollback.md             (V1.2: rollback strategy across 60 phases)
│   └── execution/
│       └── phase-01-outputs.md     (V1.2: inter-phase contract → Phase 02)
├── packages/
│   ├── shared/                     (@lifeos/shared)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts            (barrel)
│   │       ├── ids/newUlid.ts
│   │       ├── ids/newUlid.test.ts
│   │       ├── time/clock.ts
│   │       ├── time/clock.test.ts
│   │       ├── money/money.ts
│   │       ├── money/money.test.ts
│   │       ├── errors/codes.ts
│   │       ├── errors/app-error.ts
│   │       ├── errors/result.ts
│   │       ├── errors/index.ts
│   │       ├── errors/errors.test.ts
│   │       ├── envelope/envelope.ts
│   │       ├── envelope/envelope.test.ts
│   │       ├── pagination/cursor.ts
│   │       ├── env/server-env.ts
│   │       └── logger/logger.ts
│   ├── result/                     (@lifeos/result — façade only)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/index.ts
│   ├── db/                         (@lifeos/db)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── client.ts           (DbClient interface — THE contract)
│   │       ├── postgres-adapter.ts
│   │       └── tx-context.ts
│   └── route/                      (@lifeos/route)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── withApiErrorHandling.ts
│           ├── withUserRoute.ts
│           ├── withWorkspaceRoute.ts
│           ├── parseJsonBody.ts
│           └── requireIdempotencyKey.ts
├── apps/
│   ├── web/                        (@lifeos/app-web — Next.js 14)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.mjs
│   │   └── app/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       └── api/health/route.ts
│   └── worker/                     (@lifeos/app-worker)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/index.ts
└── scripts/
    ├── check-naming.ts
    ├── check-migrations.ts         (placeholder; Phase 02 activates)
    ├── check-rls.ts                (placeholder; Phase 02 activates)
    ├── check-routes-envelope.ts    (placeholder; Phase 02 activates)
    ├── check-idempotency.ts        (placeholder; Phase 02 activates)
    ├── check-no-sql-in-routes.ts   (active in Phase 01)
    ├── check-no-ai-direct-provider.ts (active)
    ├── check-no-vault-leak.ts      (placeholder; Phase 04 activates)
    ├── check-money-columns.ts      (placeholder; Phase 02 activates)
    ├── check-timezone-hardcode.ts  (active)
    ├── check-encryption-primitives.ts (placeholder; Phase 04 activates)
    ├── check-no-duplicate-app-error.ts (active — CRITICAL)
    ├── check-no-design-drift.ts    (placeholder; Phase 05 activates)
    └── __tests__/
        ├── check-no-duplicate-app-error.test.ts
        └── check-no-sql-in-routes.test.ts
```

## 3. أوامر الإنشاء من الصفر

```bash
# 1) Directories
mkdir -p apps/web/app/api/health apps/web/public apps/worker/src
mkdir -p packages/shared/src/{ids,time,money,errors,envelope,pagination,env,logger}
mkdir -p packages/result/src packages/db/src packages/route/src
mkdir -p .github/workflows .github/ISSUE_TEMPLATE .husky
mkdir -p docs/adr docs/architecture
mkdir -p scripts scripts/__tests__

# 2) Root config files
touch .nvmrc .npmrc .editorconfig .gitignore .gitattributes
touch .prettierrc.json .prettierignore .eslintrc.cjs .eslintignore
touch package.json pnpm-workspace.yaml turbo.json
touch tsconfig.base.json tsconfig.json vitest.config.ts commitlint.config.cjs

# 3) Husky
touch .husky/pre-commit .husky/commit-msg
chmod +x .husky/pre-commit .husky/commit-msg
```

📌 **ثم اكتب محتوى كل ملف بالضبط كما هو موضح في Sections 4 → 12.**

## 4. ملفات الجذر (Root config)

### 4.1 `.nvmrc`

```
v20.11.0
```

### 4.2 `.npmrc`

```
engine-strict=true
strict-peer-dependencies=true
auto-install-peers=true
shamefully-hoist=false
```

### 4.3 `.editorconfig`

```
root = true

[*]
indent_style = tab
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

### 4.4 `.gitignore`

```
node_modules
.next
dist
.turbo
coverage
*.log
.env
.env.local
.env.*.local
.DS_Store
```

### 4.4.1 `.env.example` (SoT لـ env vars المطلوبة)

```
# LifeOS environment variables — development template.
# Copy to .env.local and fill real values. Never commit .env or .env.local.
# Production secrets live in the deploy platform's secret manager.
# CI secrets live in GitHub Actions repository secrets.

# Phase 01 (introduced here)
NODE_ENV=development
DATABASE_URL=postgresql://lifeos:lifeos@localhost:5432/lifeos_dev

# Phase 02 (introduced when auth ships; placeholders here for visibility)
# SESSION_PEPPER=replace-with-32-byte-base64-secret
# COOKIE_DOMAIN=localhost

# Phase 04 (introduced when vault ships)
# VAULT_KDF_PEPPER=replace-with-32-byte-base64-secret

# Phase 06 (introduced when AI gateway ships)
# AI_PROVIDER_API_KEY=replace-when-provider-chosen
```

📌 **القاعدة:** أي Phase تُضيف env var جديد يجب أن تضيفه إلى `.env.example` في نفس PR وإلى `phase-NN-outputs.md` تحت "env required".

### 4.5 `package.json` (root)

```json
{
  "name": "lifeos-monorepo",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "engines": { "node": ">=20.11.0", "pnpm": ">=9.0.0" },
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "turbo run build",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "typecheck": "tsc -b",
    "ci:guards": "pnpm tsx scripts/check-naming.ts && pnpm tsx scripts/check-migrations.ts && pnpm tsx scripts/check-rls.ts && pnpm tsx scripts/check-routes-envelope.ts && pnpm tsx scripts/check-idempotency.ts && pnpm tsx scripts/check-no-sql-in-routes.ts && pnpm tsx scripts/check-no-ai-direct-provider.ts && pnpm tsx scripts/check-no-vault-leak.ts && pnpm tsx scripts/check-money-columns.ts && pnpm tsx scripts/check-timezone-hardcode.ts && pnpm tsx scripts/check-encryption-primitives.ts && pnpm tsx scripts/check-no-duplicate-app-error.ts && pnpm tsx scripts/check-no-design-drift.ts && pnpm tsx scripts/check-mvp-scope.ts auth",
    "prepare": "husky"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.2.0",
    "tsx": "^4.7.0",
    "turbo": "^2.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0",
    "husky": "^9.0.0",
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0"
  }
}
```

### 4.6 `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 4.7 `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalEnv": ["NODE_ENV"],
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "typecheck": { "dependsOn": ["^build"] },
    "lint": { "cache": false },
    "test": { "dependsOn": ["^build"] },
    "ci:guards": { "cache": false, "dependsOn": ["^build"] }
  }
}
```

### 4.8 `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### 4.9 `tsconfig.json` (composite)

```json
{
  "files": [],
  "references": [
    { "path": "packages/shared" },
    { "path": "packages/result" },
    { "path": "packages/db" },
    { "path": "packages/route" },
    { "path": "apps/web" },
    { "path": "apps/worker" }
  ]
}
```

### 4.10 `.prettierrc.json`

```json
{ "semi": true, "singleQuote": true, "trailingComma": "all", "useTabs": true, "printWidth": 100 }
```

### 4.11 `.eslintrc.cjs`

```jsx
module.exports = {
  root: true,
  env: { node: true, es2022: true, browser: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['dist', '.next', 'node_modules', '.turbo'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
```

### 4.12 `commitlint.config.cjs`

```jsx
module.exports = { extends: ['@commitlint/config-conventional'] };
```

### 4.13 `.husky/pre-commit`

```bash
#!/usr/bin/env sh
pnpm lint && pnpm typecheck && pnpm ci:guards
```

### 4.14 `.husky/commit-msg`

```bash
#!/usr/bin/env sh
npx --no -- commitlint --edit "$1"
```

### 4.15 `vitest.config.ts` (توسيع للملف الموجود من Phase 00)

📌 الملف موجود بالفعل من Phase 00 (بـ `include: ['scripts/**/*.test.ts']` فقط). في Phase 01 **استبدل محتواه بالكامل** بالصيغة الأوسع أدناه لتغطية `packages/**` و `apps/**` + aliases.

```tsx
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: [
			'packages/**/*.test.ts',
			'apps/**/*.test.ts',
			'scripts/**/*.test.ts',
		],
		exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/.turbo/**'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			include: ['packages/**/src/**/*.ts'],
			exclude: ['**/*.test.ts', '**/index.ts'],
		},
		poolOptions: { threads: { singleThread: true } },
	},
	resolve: {
		alias: {
			'@lifeos/shared': new URL('./packages/shared/src/index.ts', import.meta.url).pathname,
			'@lifeos/result': new URL('./packages/result/src/index.ts', import.meta.url).pathname,
			'@lifeos/db': new URL('./packages/db/src/index.ts', import.meta.url).pathname,
			'@lifeos/route': new URL('./packages/route/src/index.ts', import.meta.url).pathname,
		},
	},
});
```

## 5. حزمة `@lifeos/shared`

### 5.1 `packages/shared/package.json` (مع `types` لكل subpath — مطلوب لـ `moduleResolution: Bundler`)

```json
{
  "name": "@lifeos/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".":          { "types": "./src/index.ts",              "import": "./src/index.ts" },
    "./ids":      { "types": "./src/ids/newUlid.ts",        "import": "./src/ids/newUlid.ts" },
    "./time":     { "types": "./src/time/clock.ts",         "import": "./src/time/clock.ts" },
    "./money":    { "types": "./src/money/money.ts",        "import": "./src/money/money.ts" },
    "./errors":   { "types": "./src/errors/index.ts",       "import": "./src/errors/index.ts" },
    "./envelope": { "types": "./src/envelope/envelope.ts",  "import": "./src/envelope/envelope.ts" },
    "./pagination":{ "types": "./src/pagination/cursor.ts", "import": "./src/pagination/cursor.ts" },
    "./env":      { "types": "./src/env/server-env.ts",     "import": "./src/env/server-env.ts" },
    "./logger":   { "types": "./src/logger/logger.ts",      "import": "./src/logger/logger.ts" }
  },
  "scripts": { "build": "tsc -b", "test": "vitest run" }
}
```

### 5.2 `packages/shared/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "composite": true, "rootDir": "src", "outDir": "dist" },
  "include": ["src/**/*"]
}
```

### 5.3 `src/ids/newUlid.ts` (يستخدم Web Crypto — يعمل في Node ≥ 20 و browser)

```tsx
/**
 * App-generated ULID. Crockford base32, 26 chars.
 * Uses Web Crypto via globalThis.crypto.getRandomValues — present in Node ≥ 20 and all modern browsers.
 */
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ENCODING_LEN = ENCODING.length;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  globalThis.crypto.getRandomValues(buf);
  return buf;
}

function encodeTime(now: number): string {
  let out = '';
  for (let i = TIME_LEN - 1; i >= 0; i--) {
    const mod = now % ENCODING_LEN;
    out = ENCODING[mod]! + out;
    now = (now - mod) / ENCODING_LEN;
  }
  return out;
}

function encodeRandom(): string {
  const buf = randomBytes(RANDOM_LEN);
  let out = '';
  for (let i = 0; i < RANDOM_LEN; i++) {
    out += ENCODING[buf[i]! % ENCODING_LEN]!;
  }
  return out;
}

export function newUlid(now: number = Date.now()): string {
  return encodeTime(now) + encodeRandom();
}
```

### 5.4 `src/ids/newUlid.test.ts`

```tsx
import { describe, expect, it } from 'vitest';
import { newUlid } from './newUlid';

describe('newUlid', () => {
  it('returns a 26-character Crockford base32 string', () => {
    expect(newUlid()).toMatch(/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/);
  });
  it('returns different values on consecutive calls', () => {
    expect(newUlid()).not.toBe(newUlid());
  });
});
```

### 5.5 `src/time/clock.ts`

```tsx
export interface Clock {
  nowMs(): number;
  nowIso(): string;
}

export const systemClock: Clock = {
  nowMs: () => Date.now(),
  nowIso: () => new Date().toISOString(),
};

export function fixedClock(iso: string): Clock {
  const ms = Date.parse(iso);
  return { nowMs: () => ms, nowIso: () => new Date(ms).toISOString() };
}
```

📌 **القاعدة:** هذا الملف هو الوحيد المسموح فيه استخدام `new Date()` للـ business logic. الاستثناء الموثَّق الوحيد الآخر = `logger.ts` (لأن الـ logger يجب أن يعمل قبل أي حقن DI — موثَّق في ADR 0004 §Exceptions). كل business logic غير ذلك يجب أن يستخدم `Clock`.

### 5.6 `src/errors/codes.ts`

```tsx
export type ErrorCode =
  | 'UNKNOWN'
  | 'ENV_MISSING'
  | 'AUTH_REQUIRED'
  | 'AUTH_FORBIDDEN'
  | 'VALIDATION_FAILED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT'
  | 'IDEMPOTENCY_REQUIRED'
  | 'IDEMPOTENCY_REPLAY'
  | 'MONEY_INVALID_CURRENCY'
  | 'MONEY_CURRENCY_MISMATCH'
  | 'DB_TRANSIENT'
  | 'DB_CONSTRAINT'
  | 'DB_EXPECTED_ONE'
  | 'DB_EXPECTED_ONE_OR_NONE';
```

### 5.7 `src/errors/app-error.ts` (المصدر الوحيد لـ `AppError`)

```tsx
import type { ErrorCode } from './codes';

export class AppError extends Error {
  readonly code: ErrorCode | string;
  readonly metadata?: Record<string, unknown>;
  constructor(code: ErrorCode | string, message?: string, metadata?: Record<string, unknown>) {
    super(message ?? code);
    this.name = 'AppError';
    this.code = code;
    if (metadata) this.metadata = metadata;
  }
}
```

### 5.8 `src/errors/result.ts`

```tsx
import { AppError } from './app-error';

export type Ok<T> = { ok: true; value: T };
export type Err = { ok: false; error: AppError };
export type Result<T> = Ok<T> | Err;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = (error: AppError): Err => ({ ok: false, error });
export const isOk = <T>(r: Result<T>): r is Ok<T> => r.ok === true;
export const isErr = <T>(r: Result<T>): r is Err => r.ok === false;
```

### 5.9 `src/errors/index.ts`

```tsx
export * from './codes';
export * from './app-error';
export * from './result';
```

### 5.10 `src/money/money.ts`

```tsx
import { AppError } from '../errors/app-error';

export interface Money {
  cents: bigint;
  currency: string;
}

export function money(cents: number | bigint, currency: string): Money {
  if (currency.length !== 3)
    throw new AppError('MONEY_INVALID_CURRENCY', 'currency must be ISO-4217 3 letters');
  const c = typeof cents === 'bigint' ? cents : BigInt(Math.trunc(cents));
  return { cents: c, currency: currency.toUpperCase() };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency)
    throw new AppError('MONEY_CURRENCY_MISMATCH', 'cannot add different currencies');
  return { cents: a.cents + b.cents, currency: a.currency };
}
```

### 5.11 `src/envelope/envelope.ts` (يحتوي STATUS_MAP المركزية)

```tsx
import { AppError } from '../errors/app-error';
import type { ErrorCode } from '../errors/codes';

export type ApiSuccess<T> = { ok: true; data: T; meta?: Record<string, unknown> };
export type ApiFailure = {
	ok: false;
	error: { code: string; message: string; metadata?: Record<string, unknown> };
};
export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

/** Single SoT for ErrorCode → HTTP status. Used by withApiErrorHandling and any future route adapter. */
export const STATUS_MAP: Partial<Record<ErrorCode, number>> = {
	AUTH_REQUIRED: 401,
	AUTH_FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	IDEMPOTENCY_REPLAY: 409,
	VALIDATION_FAILED: 422,
	RATE_LIMIT: 429,
	IDEMPOTENCY_REQUIRED: 428,
	DB_EXPECTED_ONE: 500,
	DB_EXPECTED_ONE_OR_NONE: 500,
	DB_TRANSIENT: 503,
	DB_CONSTRAINT: 409,
	MONEY_INVALID_CURRENCY: 422,
	MONEY_CURRENCY_MISMATCH: 422,
	ENV_MISSING: 500,
	UNKNOWN: 500,
};

export function statusForError(e: unknown): number {
	if (e instanceof AppError) {
		const code = e.code as ErrorCode;
		return STATUS_MAP[code] ?? 500;
	}
	return 500;
}

export function envelopeOk<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
	return meta ? { ok: true, data, meta } : { ok: true, data };
}

export function envelopeErr(e: AppError | Error, fallbackCode = 'UNKNOWN'): ApiFailure {
	if (e instanceof AppError) {
		return {
			ok: false,
			error: {
				code: String(e.code),
				message: e.message,
				...(e.metadata ? { metadata: e.metadata } : {}),
			},
		};
	}
	return { ok: false, error: { code: fallbackCode, message: e.message } };
}
```

### 5.12 `src/pagination/cursor.ts`

```tsx
export interface Cursor {
  before?: string;
  after?: string;
  limit: number;
}

export function defaultCursor(limit = 50): Cursor {
  return { limit: Math.min(Math.max(limit, 1), 200) };
}

export function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64url');
}

export function decodeCursor(s: string): Cursor {
  return JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
}
```

### 5.13 `src/env/server-env.ts` (مع `resetServerEnvCache` لاستخدام الـ tests)

```tsx
import { AppError } from '../errors/app-error';

export interface ServerEnv {
	NODE_ENV: 'development' | 'test' | 'production';
	DATABASE_URL: string;
}

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
	if (cached) return cached;
	const NODE_ENV = (process.env.NODE_ENV ?? 'development') as ServerEnv['NODE_ENV'];
	const DATABASE_URL = process.env.DATABASE_URL;
	if (!DATABASE_URL) throw new AppError('ENV_MISSING', 'DATABASE_URL is required');
	cached = { NODE_ENV, DATABASE_URL };
	return cached;
}

/** Test-only: clears the cached env so the next getServerEnv() re-reads process.env. */
export function resetServerEnvCache(): void {
	cached = null;
}
```

📌 **القاعدة:** هذا الملف هو الوحيد المسموح فيه استخدام `process.env.*`. كل الباقي يستدعي `getServerEnv()`.

📌 **في الـ tests:** استدع `resetServerEnvCache()` في `beforeEach`/`afterEach` بعد أي تعديل على `process.env.DATABASE_URL`.

### 5.14 `src/logger/logger.ts`

```tsx
export interface Logger {
  info(event: string, fields?: Record<string, unknown>): void;
  warn(event: string, fields?: Record<string, unknown>): void;
  error(event: string, fields?: Record<string, unknown>): void;
}

function line(level: 'info' | 'warn' | 'error', event: string, fields?: Record<string, unknown>) {
  const payload = { level, event, ts: new Date().toISOString(), ...(fields ?? {}) };
  // eslint-disable-next-line no-console
  console[level](JSON.stringify(payload));
}

export const consoleLogger: Logger = {
  info: (e, f) => line('info', e, f),
  warn: (e, f) => line('warn', e, f),
  error: (e, f) => line('error', e, f),
};
```

### 5.15 `src/index.ts` (barrel)

```tsx
export * from './ids/newUlid';
export * from './time/clock';
export * from './money/money';
export * from './errors';
export * from './envelope/envelope';
export * from './pagination/cursor';
export * from './env/server-env';
export * from './logger/logger';
```

## 6. حزمة `@lifeos/result` (façade only — NO new definitions)

### 6.1 `packages/result/package.json`

```json
{
  "name": "@lifeos/result",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": { "@lifeos/shared": "workspace:*" }
}
```

### 6.2 `packages/result/src/index.ts`

```tsx
// Façade only. NEVER define new types here.
// Any duplicate `class AppError` outside @lifeos/shared/errors/app-error.ts breaks CI.
export { ok, err, isOk, isErr } from '@lifeos/shared/errors';
export type { Result, Ok, Err } from '@lifeos/shared/errors';
export { AppError } from '@lifeos/shared/errors';
export type { ErrorCode } from '@lifeos/shared/errors';
```

## 7. حزمة `@lifeos/db` (THE DB Client Contract)

### 7.1 `packages/db/package.json`

```json
{
  "name": "@lifeos/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": { "@lifeos/shared": "workspace:*", "postgres": "^3.4.4" }
}
```

### 7.2 `src/client.ts` (الواجهة الإلزامية — كل المراحل تستخدمها)

```tsx
export interface DbClient {
  one<T>(sql: string, params?: unknown[]): Promise<T>;
  oneOrNone<T>(sql: string, params?: unknown[]): Promise<T | null>;
  many<T>(sql: string, params?: unknown[]): Promise<T[]>;
  none(sql: string, params?: unknown[]): Promise<void>;
  tx<T>(fn: (tx: DbClient) => Promise<T>): Promise<T>;
}
```

📌 **القاعدة الذهبية:** أي package خارج `@lifeos/db` يعتمد فقط على هذه الواجهة. ممنوع استيراد `postgres` / `pg` / `pg-promise` / `prisma` خارج هذه الحزمة.

### 7.3 `src/postgres-adapter.ts`

```tsx
import postgres, { Sql } from 'postgres';
import { AppError } from '@lifeos/shared/errors';
import type { DbClient } from './client';

function wrap(sql: Sql<{}>): DbClient {
  return {
    async one<T>(query: string, params?: unknown[]): Promise<T> {
      const rows = await sql.unsafe<T[]>(query, (params ?? []) as never);
      if (rows.length !== 1)
        throw new AppError('DB_EXPECTED_ONE', `expected 1 row, got ${rows.length}`);
      return rows[0] as T;
    },
    async oneOrNone<T>(query: string, params?: unknown[]): Promise<T | null> {
      const rows = await sql.unsafe<T[]>(query, (params ?? []) as never);
      if (rows.length > 1)
        throw new AppError('DB_EXPECTED_ONE_OR_NONE', `expected ≤1 row, got ${rows.length}`);
      return (rows[0] as T) ?? null;
    },
    async many<T>(query: string, params?: unknown[]): Promise<T[]> {
      return (await sql.unsafe<T[]>(query, (params ?? []) as never)) as T[];
    },
    async none(query: string, params?: unknown[]): Promise<void> {
      await sql.unsafe(query, (params ?? []) as never);
    },
    async tx<T>(fn: (tx: DbClient) => Promise<T>): Promise<T> {
      // postgres' begin callback already provides Sql<{}>; no cast needed.
      return sql.begin((s) => fn(wrap(s))) as Promise<T>;
    },
  };
}

let client: DbClient | null = null;
export function getDb(databaseUrl: string): DbClient {
  if (client) return client;
  const sql = postgres(databaseUrl, { max: 10, prepare: false });
  client = wrap(sql);
  return client;
}
```

### 7.4 `src/tx-context.ts` (placeholder للـ workspace context — Phase 02 يستخدمها)

```tsx
import type { DbClient } from './client';

export interface WorkspaceCtx {
  userId: string;
  workspaceId: string;
}

/**
 * Sets per-transaction GUCs so RLS policies can read them via current_setting().
 * The third argument `true` to set_config = transaction-scoped (NOT session-scoped). CRITICAL.
 */
export async function withWorkspaceContext<T>(
  db: DbClient,
  ctx: WorkspaceCtx,
  fn: (tx: DbClient) => Promise<T>,
): Promise<T> {
  return db.tx(async (tx) => {
    await tx.none("select set_config('app.current_user_id', $1, true)", [ctx.userId]);
    await tx.none("select set_config('app.current_workspace_id', $1, true)", [ctx.workspaceId]);
    return fn(tx);
  });
}
```

### 7.5 `src/index.ts`

```tsx
export * from './client';
export * from './postgres-adapter';
export * from './tx-context';
```

## 8. حزمة `@lifeos/route`

### 8.1 `packages/route/package.json`

```json
{
  "name": "@lifeos/route",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": { "@lifeos/shared": "workspace:*", "zod": "^3.23.0" }
}
```

### 8.2 `src/withApiErrorHandling.ts`

```tsx
import { AppError, envelopeErr, statusForError, consoleLogger } from '@lifeos/shared';

export type Handler = (req: Request) => Promise<Response>;

export function withApiErrorHandling(handler: Handler): Handler {
	return async (req) => {
		try {
			return await handler(req);
		} catch (e) {
			const error = e instanceof Error ? e : new Error('Unknown error');
			consoleLogger.error('api_error', {
				code: e instanceof AppError ? e.code : 'UNKNOWN',
				message: error.message,
			});
			return Response.json(envelopeErr(error), { status: statusForError(e) });
		}
	};
}
```

### 8.3 `src/withUserRoute.ts` (placeholder — Phase 05 ينفذ session lookup)

```tsx
import { AppError } from '@lifeos/shared';
import { withApiErrorHandling, type Handler } from './withApiErrorHandling';

export function withUserRoute(
  handler: (req: Request, user: { id: string }) => Promise<Response>,
): Handler {
  return withApiErrorHandling(async () => {
    // Phase 05 will replace this body with actual session lookup.
    throw new AppError('AUTH_REQUIRED', 'session lookup not wired yet (implemented in Phase 05)');
  });
}
```

### 8.4 `src/withWorkspaceRoute.ts` (placeholder)

```tsx
import { AppError } from '@lifeos/shared';
import { withApiErrorHandling, type Handler } from './withApiErrorHandling';

export function withWorkspaceRoute(
  handler: (req: Request, ctx: { userId: string; workspaceId: string }) => Promise<Response>,
): Handler {
  return withApiErrorHandling(async () => {
    throw new AppError('AUTH_REQUIRED', 'workspace context not wired yet (implemented in Phase 02 + Phase 05)');
  });
}
```

### 8.5 `src/parseJsonBody.ts`

```tsx
import { AppError } from '@lifeos/shared';
import type { ZodTypeAny, z } from 'zod';

export async function parseJsonBody<S extends ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new AppError('VALIDATION_FAILED', 'invalid JSON body');
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success)
    throw new AppError('VALIDATION_FAILED', 'body schema mismatch', { issues: parsed.error.issues });
  return parsed.data;
}
```

### 8.6 `src/requireIdempotencyKey.ts`

```tsx
import { AppError } from '@lifeos/shared';

export function requireIdempotencyKey(req: Request): string {
  const key = req.headers.get('idempotency-key');
  if (!key || key.length < 8)
    throw new AppError('IDEMPOTENCY_REQUIRED', 'Idempotency-Key header is required (≥ 8 chars)');
  return key;
}
```

### 8.7 `src/index.ts`

```tsx
export * from './withApiErrorHandling';
export * from './withUserRoute';
export * from './withWorkspaceRoute';
export * from './parseJsonBody';
export * from './requireIdempotencyKey';
```

## 9. تطبيقات Skeleton

### 9.1 `apps/web/package.json`

```json
{
  "name": "@lifeos/app-web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": { "build": "next build", "dev": "next dev", "start": "next start" },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@lifeos/shared": "workspace:*",
    "@lifeos/route": "workspace:*"
  }
}
```

### 9.2 `apps/web/tsconfig.json` (إلزامي لـ composite في tsconfig.json الجذر)

```json
{
	"extends": "../../tsconfig.base.json",
	"compilerOptions": {
		"composite": true,
		"jsx": "preserve",
		"plugins": [{ "name": "next" }],
		"paths": {
			"@lifeos/shared": ["../../packages/shared/src/index.ts"],
			"@lifeos/shared/*": ["../../packages/shared/src/*"],
			"@lifeos/route": ["../../packages/route/src/index.ts"]
		},
		"noEmit": true
	},
	"include": ["next-env.d.ts", "app/**/*.ts", "app/**/*.tsx"],
	"references": [
		{ "path": "../../packages/shared" },
		{ "path": "../../packages/route" }
	]
}
```

### 9.2 `apps/web/next.config.mjs`

```jsx
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  transpilePackages: ['@lifeos/shared', '@lifeos/route'],
};
export default nextConfig;
```

### 9.3 `apps/web/app/api/health/route.ts`

```tsx
import { envelopeOk } from '@lifeos/shared';
import { withApiErrorHandling } from '@lifeos/route';

export const GET = withApiErrorHandling(async () => {
  return Response.json(envelopeOk({ status: 'ok', phase: '01' }));
});
```

### 9.4 `apps/web/app/layout.tsx`

```tsx
export const metadata = { title: 'LifeOS', description: 'Phase 01 skeleton' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### 9.5 `apps/web/app/page.tsx`

```tsx
export default function Page() {
  return <main>LifeOS Phase 01 — contracts frozen.</main>;
}
```

### 9.6 `apps/worker/package.json`

```json
{
  "name": "@lifeos/app-worker",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "scripts": { "build": "tsc -b" },
  "dependencies": { "@lifeos/shared": "workspace:*" }
}
```

### 9.7 `apps/worker/src/index.ts`

```tsx
import { consoleLogger } from '@lifeos/shared/logger';
consoleLogger.info('worker_boot', { phase: '01' });
```

## 10. CI Guards (14 سكريبت)

📌 **في Phase 01: 5 سكريبتات نشطة (no-sql-in-routes, no-ai-direct-provider, timezone-hardcode, no-duplicate-app-error, naming). الباقي placeholders تُفعَّل في المراحل اللاحقة.**

### 10.1 `scripts/check-no-duplicate-app-error.ts` (نشط — CRITICAL)

```tsx
import { execSync } from 'node:child_process';

const out = execSync(
  `grep -RIn --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.turbo "class AppError" . || true`,
  { encoding: 'utf8' },
);

const lines = out
  .split('\n')
  .filter(Boolean)
  .filter((l) => !l.includes('packages/shared/src/errors/app-error.ts'));

if (lines.length > 0) {
  console.error('DUPLICATE_APP_ERROR:\n' + lines.join('\n'));
  process.exit(1);
}
console.log('check-no-duplicate-app-error OK');
```

### 10.2 `scripts/check-no-sql-in-routes.ts` (نشط)

```tsx
import { execSync } from 'node:child_process';
const out = execSync(
  `grep -RIn -E "(SELECT |INSERT |UPDATE |DELETE )" apps/web/app/api 2>/dev/null || true`,
  { encoding: 'utf8' },
);
if (out.trim().length > 0) {
  console.error('SQL_IN_ROUTE:\n' + out);
  process.exit(1);
}
console.log('check-no-sql-in-routes OK');
```

### 10.3 `scripts/check-no-ai-direct-provider.ts` (نشط)

```tsx
import { execSync } from 'node:child_process';
const cmd = `grep -RInE "from ['\"](openai|@anthropic-ai/sdk|@google/generative-ai)['\"]" apps packages 2>/dev/null | grep -v 'packages/ai' || true`;
const out = execSync(cmd, { encoding: 'utf8', shell: '/bin/bash' });
if (out.trim().length > 0) {
  console.error('AI_DIRECT_PROVIDER:\n' + out);
  process.exit(1);
}
console.log('check-no-ai-direct-provider OK');
```

### 10.4 `scripts/check-timezone-hardcode.ts` (نشط)

```tsx
import { execSync } from 'node:child_process';
const out = execSync(
  `grep -RIn "new Date(" packages apps 2>/dev/null | grep -v '\\.test\\.' | grep -v 'packages/shared/src/time' | grep -v 'packages/shared/src/logger' || true`,
  { encoding: 'utf8' },
);
if (out.trim().length > 0) {
  console.error('NEW_DATE_FORBIDDEN (use Clock from @lifeos/shared/time):\n' + out);
  process.exit(1);
}
console.log('check-timezone-hardcode OK');
```

### 10.5 `scripts/check-naming.ts` (نشط — kebab-case للـ **directories** فقط داخل packages/scripts/migrations؛ camelCase مسموح لملفات `.ts` داخل `src/`)

```tsx
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const SKIP = new Set(['node_modules', '.next', '.turbo', 'dist', '.git', '__tests__']);
const ROOTS_FOR_DIRS = ['packages', 'scripts', 'apps', 'migrations'];
const MIGRATION_FILE_PATTERN = /^\d{4}__[a-z][a-z0-9_]*\.sql$/;

function walk(dir: string): Array<{ path: string; isDir: boolean }> {
	const out: Array<{ path: string; isDir: boolean }> = [];
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		if (SKIP.has(e.name)) continue;
		const p = join(dir, e.name);
		if (e.isDirectory()) {
			out.push({ path: p, isDir: true });
			out.push(...walk(p));
		} else {
			out.push({ path: p, isDir: false });
		}
	}
	return out;
}

const BAD: string[] = [];
const cwd = process.cwd();
for (const e of walk(cwd)) {
	const rel = relative(cwd, e.path);
	const topRoot = rel.split('/')[0];
	if (!ROOTS_FOR_DIRS.includes(topRoot)) continue;
	const name = rel.split('/').pop()!;
	if (name.startsWith('.')) continue;

	if (e.isDir) {
		// Directory naming: kebab-case only (no uppercase, no underscores except __tests__ which is SKIPped).
		if (/[A-Z]/.test(name) || /_/.test(name)) BAD.push(`dir: ${rel}`);
		continue;
	}

	// File naming rules per location:
	if (rel.startsWith('migrations/')) {
		if (!MIGRATION_FILE_PATTERN.test(name)) BAD.push(`migration: ${rel} (expected NNNN__snake_case.sql)`);
		continue;
	}

	// For source files inside packages/*/src or apps/*/(app|src), camelCase or kebab-case is fine; only enforce no spaces & no UPPERCASE-only files.
	if (/^[A-Z][A-Z0-9_-]+\.(tsx?|md|json|yaml|yml|mjs|cjs)$/.test(name) && name !== 'README.md' && name !== 'LICENSE') {
		BAD.push(`shouty file: ${rel}`);
	}
}

if (BAD.length > 0) {
	console.error('NAMING_VIOLATION:\n' + BAD.join('\n'));
	process.exit(1);
}
console.log('check-naming OK');
```

📌 **القاعدة المعتمدة:**

- Directories تحت `packages/` `apps/` `scripts/` `migrations/` = kebab-case، بدون underscores، بدون uppercase.
- ملفات `.ts/.tsx` داخل `src/` = camelCase أو kebab-case مقبول (لا قيد على حالة الحروف).
- ملفات migration = `NNNN__snake_case.sql` فقط.
- ممنوع ملفات SHOUTY-CASE خارج `README.md` و `LICENSE`.

### 10.6 سكريبتات Placeholder (9 ملفات)

كل واحد نفس النمط:

```tsx
// scripts/check-migrations.ts — Phase 02 activates (full enforcement).
//
// Reserved migration ranges (binding across all phases):
//   Phase 01 (W00): 0001..0099  — RESERVED, none created in W00.
//   Phase 02 (W01): 0100..0199  — auth, workspace, profile, page kernel + RLS.
//   Phase 03 (W02): 0200..0299  — tasks, notes, habits, expenses, calendar, vault, ai_usage.
//   Phase 04 (W03): 0300..0399  — security hardening, offline outbox, audit, push.
//   Phase 05 (W04): (none)      — UI only, no migrations.
//
// Phase 02 enforcement (when activated):
//   - filename pattern: NNNN__snake_case.sql
//   - monotonic, no gaps within an active range
//   - each migration wrapped in BEGIN/COMMIT
//   - any new tenant table must enable + force RLS in 0112 or a later file
//
// Until then, this placeholder simply confirms the script is wired into ci:guards.
console.log('check-migrations OK (phase 01 placeholder; ranges reserved above)');
```

```tsx
// scripts/check-rls.ts — Phase 02 activates.
console.log('check-rls OK (phase 01 placeholder)');
```

```tsx
// scripts/check-routes-envelope.ts — Phase 02 activates.
console.log('check-routes-envelope OK (phase 01 placeholder)');
```

```tsx
// scripts/check-idempotency.ts — Phase 02 activates.
console.log('check-idempotency OK (phase 01 placeholder)');
```

```tsx
// scripts/check-no-vault-leak.ts — Phase 04 activates.
console.log('check-no-vault-leak OK (phase 01 placeholder)');
```

```tsx
// scripts/check-money-columns.ts — Phase 02 activates.
console.log('check-money-columns OK (phase 01 placeholder)');
```

```tsx
// scripts/check-encryption-primitives.ts — Phase 04 activates.
console.log('check-encryption-primitives OK (phase 01 placeholder)');
```

```tsx
// scripts/check-no-design-drift.ts — Phase 05 activates.
console.log('check-no-design-drift OK (phase 01 placeholder)');
```

📌 **ملاحظة:** `scripts/check-mvp-scope.ts` تم إنشاؤه في Phase 00. لا تعيد إنشاءه.

### 10.7 اختبار `scripts/__tests__/check-no-duplicate-app-error.test.ts`

```tsx
import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';

describe('check-no-duplicate-app-error', () => {
  it('exits 0 on a clean repo (only canonical AppError exists)', () => {
    const out = execSync('pnpm tsx scripts/check-no-duplicate-app-error.ts', { encoding: 'utf8' });
    expect(out).toContain('check-no-duplicate-app-error OK');
  });
});
```

## 11. GitHub Actions

### 11.1 `.github/workflows/ci.yml`

```yaml
name: ci
on:
  push: { branches: [main] }
  pull_request:

jobs:
  guards:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20.11.0, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm ci:guards
      - run: pnpm test
```

### 11.2 `docs/execution/phase-01-outputs.md` (Inter-phase Contract → Phase 02)

```markdown
# Phase 01 Outputs (→ Phase 02 contract)

> AI Executor of Phase 02 may rely on the following being present and correct after `git tag --list | grep -x phase-01-locked` exits 0.

## A. Packages (guaranteed)
- `@lifeos/shared` — ids/newUlid, time/Clock, money, errors (AppError + ErrorCode + Result), envelope (STATUS_MAP + statusForError), pagination/cursor, env/server-env (+ resetServerEnvCache), logger.
- `@lifeos/result` — façade re-export of `@lifeos/shared/errors`. NO new definitions.
- `@lifeos/db` — `DbClient` interface (`one/oneOrNone/many/none/tx`) + `postgres-adapter` over `postgres` + `withWorkspaceContext` (sets `app.current_user_id` + `app.current_workspace_id` per-tx).
- `@lifeos/route` — `withApiErrorHandling`, `withUserRoute` (stub), `withWorkspaceRoute` (stub), `parseJsonBody`, `requireIdempotencyKey`.

## B. Apps (guaranteed)
- `@lifeos/app-web` — Next.js 14 skeleton with `/api/health` returning `envelopeOk({ status: 'ok', phase: '01' })`.
- `@lifeos/app-worker` — placeholder logger boot.

## C. Scripts (guaranteed)
- `scripts/check-mvp-scope.ts` (from Phase 00; reused as-is).
- 5 active guards: `check-naming`, `check-no-sql-in-routes`, `check-no-ai-direct-provider`, `check-timezone-hardcode`, `check-no-duplicate-app-error`.
- 9 placeholder guards wired into `ci:guards` and ready for activation: `check-migrations` (P02), `check-rls` (P02), `check-routes-envelope` (P02), `check-idempotency` (P02), `check-money-columns` (P02), `check-no-vault-leak` (P04), `check-encryption-primitives` (P04), `check-no-design-drift` (P05), plus reserved slots.

## D. Git artefacts (guaranteed)
- Branch: `phase/01-architecture` (merged into `main` before lock).
- Annotated tag: `phase-01-locked` (replaces deprecated `w00-frozen`).

## E. Env vars introduced
- `NODE_ENV` (development|test|production)
- `DATABASE_URL` (required at runtime; throws `ENV_MISSING` if absent)
Both documented in `.env.example` at repo root.

## F. Migration range used
None. Phase 01 reserves `0001..0099` but creates no migrations. Phase 02 starts at `0100__*.sql`.

## G. Stubs left behind for later phases
- `withUserRoute` and `withWorkspaceRoute` throw `AUTH_REQUIRED` until Phase 02 (workspace context) + Phase 05 (session lookup).
- `check-migrations`, `check-rls`, `check-routes-envelope`, `check-idempotency`, `check-money-columns` → activate in Phase 02.
- `check-no-vault-leak`, `check-encryption-primitives` → activate in Phase 04.
- `check-no-design-drift` → activate in Phase 05.
- `packages/ai` → first import in Phase 06.

## H. ADRs introduced
- ADR 0001 — Monorepo & Tooling.
- ADR 0002 — Naming Conventions.
- ADR 0003 — DB Client Interface.
- ADR 0004 — Errors, Result, and Time Exceptions.

## I. Documents introduced
- 6 architecture docs in `docs/architecture/`.
- `docs/runbooks/rollback.md` (rollback protocol).
- `.env.example` (env SoT).

## J. Open risks carried forward
All 11 risks from Phase 00 remain Open. Phase 01 partially mitigates:
- RISK-005 (vendor lock-in) → `@lifeos/db` interface abstracts the driver.
- RISK-011 (duplicate SoT) → `check-no-duplicate-app-error` enforces single AppError.
Phase 02 inherits the rest.
```

### 11.3 `docs/runbooks/rollback.md` (rollback strategy لـ 60 مرحلة)

```markdown
# Rollback Runbook — LifeOS

> Updated whenever a new external system (storage, push, AI provider, migration range, billing-adjacent system) is added. Each phase whose Definition of Done introduces irreversible state MUST update this file.

## 1. Principles
- Every deployable artefact corresponds to exactly one annotated git tag of the form `phase-NN-locked`.
- Rolling back = redeploying the previous `phase-NN-locked` tag.
- The database is the only stateful surface that does not trivially revert. Migrations are forward-only at the SQL level; rollback is documented per migration.
- No phase is considered complete until its rollback path is written here.

## 2. Code rollback (any phase ≥ 01)
```

# 1) Identify the previous good tag

git tag --list 'phase-*-locked' --sort=-creatordate | head -5

# 2) Check out and redeploy

git checkout phase-NN-locked

# Follow the deploy platform's redeploy procedure for this tag.

```

## 3. Migration rollback (from Phase 02 onward)
- Every migration file MUST end with a `-- ROLLBACK:` comment block describing the inverse SQL.
- For destructive migrations (DROP COLUMN, DROP TABLE), the rollback block MUST include the data-preservation step (CREATE TABLE … SELECT * FROM … before DROP).
- For non-destructive forward additions (ADD COLUMN nullable, CREATE INDEX CONCURRENTLY), the rollback is the literal `DROP` of the new object.
- Rollback execution requires a maintenance window unless explicitly marked `-- ROLLBACK-SAFE-ONLINE:` in the migration footer.

## 4. Feature-flag fallback (from Phase 05 onward, when flags exist)
- New user-visible features ship behind a flag in `@lifeos/shared/flags`.
- Disabling the flag does NOT require a redeploy; it requires a single config change.
- A feature flag rollback is preferred over a tag rollback whenever the breaking change is in UI or non-schema logic.

## 5. Secrets rollback
- If a secret is leaked: rotate in the deploy platform first, then in CI secrets, then update `.env.example` row if the variable name changes.
- See `docs/runbooks/secret-rotation.md` (introduced before Phase 60).

## 6. Storage rollback (from Phase 03 onward, when storage exists)
- Object storage operations MUST be idempotent and use content-addressed keys; no rollback needed for puts.
- For deletes, soft-delete only; permanent delete requires an explicit grace period documented here.

## 7. Push / email / external provider rollback (from Phase 04 onward)
- Disable the provider in `@lifeos/shared/env` or via feature flag.
- Outbox-backed integrations (Phase 04+) drain after rollback automatically.

## 8. Per-phase rollback notes
Each phase appends its own subsection here as part of its Definition of Done.

### Phase 01 — Architecture & Naming
- Rollback = redeploy the previous tag (none yet; this is the first phase that produces deployable code).
- No DB migrations, no external providers.
- Removing `phase-01-locked` tag is **forbidden**; superseding tag MUST be `phase-01-locked-revoked` with an ADR.
```

### 11.4 `.github/pull_request_template.md`

```markdown
## Scope Gate (Phase 00)
- [ ] Feature key matches a row in docs/product/mvp-scope.md
- [ ] Linked metric:
- [ ] Phase owner:
- [ ] Privacy/security risk addressed:

## Conventions (Phase 01)
- [ ] No SQL in route handlers
- [ ] No SELECT *
- [ ] No process.env.* outside @lifeos/shared/env
- [ ] Imports use @lifeos/* (no relative paths to other packages)
- [ ] AppError imported from @lifeos/shared/errors or @lifeos/result façade only
- [ ] DB calls go through DbClient.one/oneOrNone/many/none/tx
- [ ] No `new Date()` outside @lifeos/shared/time
- [ ] No direct AI SDK import (Phase 06 only)

## Tests
- [ ] Unit tests added
- [ ] Integration test or repo test where relevant
```

## 12. ADRs (4 ملفات)

### 12.1 `docs/adr/0001-monorepo-tooling.md`

```markdown
# ADR 0001 — Monorepo & Tooling

- Status: Accepted
- Date: YYYY-MM-DD
- Owner: DX

## Decision
Monorepo with pnpm workspaces + turbo. Node 20.11.0, ESM only, strict TS. eslint + prettier + husky + vitest.

## Alternatives Considered
- npm workspaces — slower install, weaker peer enforcement.
- yarn berry — additional learning curve, PnP friction with Next.js.
- nx — heavier; we do not need its graph features yet.

## Consequences
- Single source of truth for tooling versions.
- Any drift requires a new ADR.
```

### 12.2 `docs/adr/0002-naming-conventions.md`

```markdown
# ADR 0002 — Naming Conventions

- Status: Accepted
- Date: YYYY-MM-DD
- Owner: DX

## Decision
See Section 18 of `docs/governance/global-conventions.md`. Tables snake_case plural; files kebab-case; routes `/api/v1/<plural>`; packages `@lifeos/*`.

## Enforcement
`scripts/check-naming.ts` + this ADR.
```

### 12.3 `docs/adr/0003-db-client-interface.md`

```markdown
# ADR 0003 — DB Client Interface

- Status: Accepted
- Date: YYYY-MM-DD
- Owner: Backend

## Decision
The only DB API used in LifeOS is `one / oneOrNone / many / none / tx`.
Implemented in `@lifeos/db/postgres-adapter.ts` over the `postgres` npm package.
Using `pg`, `pg-promise`, raw `postgres.unsafe`, or Prisma in business code is forbidden.

## Alternatives Considered
- `pg-promise` — bigger API surface, harder to mock.
- `prisma` — ORM lock-in, less control over RLS GUCs.
- raw `pg` — too low-level; would force every repo to handle pooling.

## Consequences
- Driver-independent surface.
- Uniform error semantics across repos.
- Easy mocking in tests.
```

### 12.4 `docs/adr/0004-error-and-result.md`

```markdown
# ADR 0004 — Errors, Result, and Time Exceptions

- Status: Accepted
- Date: YYYY-MM-DD
- Owner: Backend/DX

## Decision
- `AppError`, `ErrorCode`, `Result`, `ok`, `err`, `isOk`, `isErr` exist exactly once at `@lifeos/shared/errors`.
- `@lifeos/result` is a thin re-export façade.
- API envelope: `{ ok: true, data, meta? }` or `{ ok: false, error: { code, message, metadata? } }`.
- `STATUS_MAP` (ErrorCode → HTTP status) lives in `@lifeos/shared/envelope` and is the single source of truth.
- Route adapters never inline status logic; they call `statusForError(e)`.

## Exceptions to the Clock Rule
The global rule "no `new Date()` outside `@lifeos/shared/time`" has exactly two documented exceptions:
1. `packages/shared/src/time/clock.ts` — the Clock implementation itself.
2. `packages/shared/src/logger/logger.ts` — the logger emits a wall-clock timestamp at log-line construction time. It must work before any DI container or Clock instance exists (e.g. during server bootstrap and inside error handlers). It is intentionally untestable for time and never participates in business logic.
Any third exception requires a new ADR.

## Enforcement
- `scripts/check-no-duplicate-app-error.ts` fails CI on any duplicate `class AppError`.
- `scripts/check-timezone-hardcode.ts` excludes only the two paths above.
```

## 13. Architecture docs (6 ملفات)

محتوى موجز يكفي للملخصات؛ كل واحد ≥ 30 سطر بمحتوى حقيقي:

- `docs/architecture/overview.md` — high-level diagram + package map.
- `docs/architecture/package-map.md` — كل package + dependencies + ownership.
- `docs/architecture/error-model.md` — كيف يعمل AppError + Result + Envelope.
- `docs/architecture/id-generation.md` — لماذا ULID + شكل المعرف + التوافق مع Web Crypto.
- `docs/architecture/money-and-time.md` — قواعد Money cents + Clock abstraction.
- `docs/architecture/api-envelope.md` — أمثلة لـ success/failure + كل HTTP status mapping.

## 14. Cross-phase Consistency Rules

- ✅ Phase 01 لا يُنشئ migrations فعلية. Phase 02 يبدأ من `0100__*.sql`.
- ✅ Phase 01 لا يُنشئ tables. `withWorkspaceContext` placeholder موجود.
- ✅ Phase 01 لا يبني auth UI. `withUserRoute` و `withWorkspaceRoute` يرميان `AUTH_REQUIRED`.
- ✅ Phase 01 لا يستورد أي AI SDK. الـ guard يفشل CI.
- ✅ `@lifeos/result` re-export فقط؛ لا تعريفات جديدة.
- ✅ كل package يستخدم `workspace:*`.
- ✅ ULID مولّد عبر `globalThis.crypto.getRandomValues`.
- ✅ DB Client API ثابتة: `one/oneOrNone/many/none/tx`.
- ✅ Migration ranges: Phase 01 = 0001..0099 (محجوز للـ bootstrap fixtures إن لزم لاحقاً، لكن في هذه المرحلة لا migrations).
- ✅ **Branch convention:** `phase/01-architecture` (موحد عبر الـ 60 مرحلة).
- ✅ **End-of-phase tag:** `phase-01-locked` (annotated).
- ✅ **Inter-phase contract:** `docs/execution/phase-01-outputs.md` إلزامي.
- ✅ **Secrets SoT:** `.env.example` في الجذر + GitHub Actions secrets لـ CI + deploy platform لـ production.
- ✅ **Rollback:** `docs/runbooks/rollback.md` موجود ويضيف كل phase تالية قسمها.

## 15. AI Executor Warnings

- ❌ لا تكتب SQL في `apps/web/app/api/**/route.ts`.
- ❌ لا تُنشئ `class AppError` خارج `packages/shared/src/errors/app-error.ts`.
- ❌ لا تستورد `postgres` / `pg` / `pg-promise` خارج `@lifeos/db`.
- ❌ لا تستورد `openai` / `@anthropic-ai/sdk` / `@google/generative-ai` (محجوز لـ Phase 06).
- ❌ لا تضف Tailwind / CSS هنا. Phase 05 يبدأ UI.
- ❌ لا تضف `localStorage`.
- ❌ لا تستخدم `process.env.X` خارج `getServerEnv()`.
- ❌ لا تستخدم `new Date()` خارج `packages/shared/src/time/` و `logger/`.
- ❌ لا تستخدم imports نسبية بين packages (`../../shared`). استخدم `@lifeos/shared`.

## 16. Checklist النهائي (16 بند)

- [ ]  `pnpm install` ينجح بدون warnings.
- [ ]  `pnpm typecheck` ينجح.
- [ ]  `pnpm lint` ينجح.
- [ ]  `pnpm test` ينجح (newUlid, money, envelope, errors).
- [ ]  `pnpm ci:guards` ينجح بالكامل.
- [ ]  `pnpm --filter @lifeos/app-web dev` يُشغّل خادم محلي.
- [ ]  `curl http://localhost:3000/api/health` يعيد `{ ok: true, data: { status: "ok", phase: "01" } }`.
- [ ]  `check-no-duplicate-app-error` يفشل لو أضفت `class AppError` ثانية في أي مكان.
- [ ]  `check-no-sql-in-routes` يفشل لو وضعت `SELECT` في `route.ts`.
- [ ]  `check-no-ai-direct-provider` يفشل لو استوردت `openai`.
- [ ]  `check-timezone-hardcode` يفشل لو استخدمت `new Date()` خارج time/logger.
- [ ]  كل imports تستخدم `@lifeos/*` (لا relative paths بين packages).
- [ ]  husky pre-commit يشتغل ويوقف commits المخالفة.
- [ ]  4 ADRs مكتوبة.
- [ ]  6 architecture docs مكتوبة.
- [ ]  tag `phase-01-locked` معمول ومدفوع (التسمية الموحدة V1.2).

## 17. أوامر القفل النهائي

```bash
# Sanity (must all exit 0)
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm ci:guards
pnpm test

# Verify cross-phase outputs exist before tagging
test -f .env.example
test -f docs/runbooks/rollback.md
test -f docs/execution/phase-01-outputs.md

# Commit + tag
git add .
git commit -m "phase-01: architecture contracts & naming freeze"
git tag -a phase-01-locked -m "Phase 01 locked: @lifeos/shared, @lifeos/result, @lifeos/db, @lifeos/route, 14 CI guards, 4 ADRs, .env.example, rollback runbook, phase-01-outputs.md"
git push origin phase/01-architecture
git push origin phase-01-locked

# Sanity check (must exit 0):
git tag --list | grep -x phase-01-locked
```

## 18. Definition of Done

Phase 01 جاهزة فقط عند:

- 4 packages تبني بنجاح (`@lifeos/shared`, `@lifeos/result`, `@lifeos/db`, `@lifeos/route`).
- 2 apps تبني بنجاح (`@lifeos/app-web`, `@lifeos/app-worker`).
- 14 CI guard موجودة (5 نشطة + 9 placeholders + check-mvp-scope من Phase 00).
- 4 ADRs + 6 architecture docs مكتوبة بمحتوى حقيقي.
- husky pre-commit يفشل عند المخالفات.
- لا يوجد `class AppError` مكرر.
- لا يوجد SQL في routes.
- لا يوجد import مباشر لـ AI SDK.
- لا يوجد `new Date()` خارج time/logger.
- DB Client API هي `one/oneOrNone/many/none/tx` حصراً.
- ULID يولّد بنجاح في Node ≥ 20.
- `/api/health` يرد envelope صحيح.
- `.env.example` موجود في الجذر ويحتوي `NODE_ENV` + `DATABASE_URL`.
- `docs/runbooks/rollback.md` موجود ويحتوي 8 أقسام + قسم Phase 01.
- `docs/execution/phase-01-outputs.md` موجود ويحتوي أقسام A→J.
- git tag `phase-01-locked` معمول ومدفوع.
- branch المرحلة كان `phase/01-architecture`.

## 19. ➡️ الانتقال إلى Phase 02

بعد قفل `phase-01-locked` (التسمية الموحدة V1.2)، انتقل إلى [مرحلة 2](https://www.notion.so/2-1282e654c400477592f429164a9b31ef?pvs=21) (Kernel: Workspace, Profile, Pages).