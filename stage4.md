# مرحلة 4 — الأمان، الـ Vault Crypto، الـ CSP، والـ Offline

<aside>
🔒

**الفرع:** `phase/04-security`

**التاج:** `phase-04-locked` (annotated)

**نطاق الـ migrations:** `0148..0199`

**التبعيات:** Phase 03 مُقفلة (`phase-03-locked`)

</aside>

## 1. الهدف والنطاق

هذه المرحلة تبني الطبقة الأمنية الجوهرية فوق منصة Phase 03:

- **Vault crypto**: تشفير client-side لعناصر الـ vault باستخدام XChaCha20-Poly1305 + Argon2id KDF (master-key → item-key envelope).
- **CSP + nonce middleware**: Strict CSP بدون `unsafe-inline`، nonce لكل request، CSP report endpoint.
- **CSRF protection**: double-submit cookie + timing-safe verification.
- **Audit chain**: hash-linked audit events مع DB-stored hashes + tamper detection.
- **Service Worker**: offline-first + outbox مع body-hash verification.
- **Secret scanner**: تفعيل `check-no-vault-leak.ts` كـ CI gate (كان placeholder في Phase 01).
- **OAuth state store**: PKCE + state nonce DB-backed.

## 2. العقد مع المراحل السابقة

### 2.1 المُستهلَك من Phase 01

- `AppError` + `STATUS_MAP` + `ErrorCodeRegistry` (declaration merging — Phase 03 V1.1)
- `envelopeOk` + `envelopeErr` من `@lifeos/shared` — **الاسم الصحيح هو `envelopeOk` (ليس `okEnvelope`)**
- `systemClock` + `logger` من `@lifeos/shared`
- `timingSafeEqual` wrapper موجود مسبقاً في `@lifeos/shared/src/crypto/timing-safe.ts`
- `check-no-vault-leak.ts` — كان placeholder، الآن يُفعَّل

### 2.2 المُستهلَك من Phase 02

- `withWorkspaceContext` لـ DB tenancy
- `workspace_audit_events` (الجدول الأصلي) + الـ extensions في 0149
- `ServerEnv` schema يُضاف له: `VAULT_PEPPER`, `CSRF_SECRET`, `CSP_REPORT_URI`, `OAUTH_STATE_TTL_MINUTES`
- `invitationGenericError()` و `Idempotency-Key` middleware

### 2.3 المُستهلَك من Phase 03

- `assertCapability(actor, capability)` من `@lifeos/permissions` — **ليس `resolver.assertCapability`**
- `Actor` type من `@lifeos/permissions`
- `BaseRepo` مع `softDelete: boolean` flag
- `withWorkspaceRoute(async ({ req, workspaceId, userId, role }) => ...)` — **`role` مطلوب لاستخدام `assertCapability`**
- `packages/repo` workspace package
- `ErrorCodeRegistry` interface — يُمدَّد declaration merging هنا

### 2.4 المُنتَج لـ Phase 05+

- `packages/vault-crypto` ابتدائي
- `packages/security` (CSP, CSRF, audit-chain, scanner)
- `packages/offline` (outbox, body-hash, backoff)
- 11 AppError code جديد
- 6 ADRs (0018..0023)
- Migrations 0148..0199 (المتاح للمراحل التالية: 0200..)

## 3. خريطة الملفات (الكاملة)

```
packages/vault-crypto/
├── package.json                          (3.1)
├── tsconfig.json
├── src/
│   ├── argon2.ts                         (3.2)
│   ├── xchacha20-poly1305.ts             (3.3)
│   ├── master-key.ts                     (3.4)
│   ├── item-key.ts                       (3.5)
│   ├── envelope.ts                       (3.6)
│   └── index.ts                          (3.7)
└── tests/
    ├── argon2.test.ts
    ├── envelope.test.ts
    └── round-trip.test.ts

packages/security/
├── package.json                          (4.1)
├── tsconfig.json
├── src/
│   ├── csp.ts                            (4.2)
│   ├── nonce.ts                          (4.3)
│   ├── csrf.ts                           (4.4)
│   ├── audit-chain.ts                    (4.5)
│   ├── scanner.ts                        (4.6)
│   ├── oauth-state.ts                    (4.7)
│   └── index.ts                          (4.8)
└── tests/
    ├── csrf.test.ts
    ├── audit-chain.test.ts
    ├── scanner.test.ts
    └── oauth-state.test.ts

packages/offline/
├── package.json                          (5.1)
├── tsconfig.json
├── src/
│   ├── outbox.ts                         (5.2)
│   ├── body-hash.ts                      (5.3)
│   ├── backoff.ts                        (5.4)
│   └── index.ts                          (5.5)
└── tests/
    ├── outbox.test.ts
    ├── body-hash.test.ts
    └── backoff.test.ts

apps/web/
├── middleware.ts                         (6.1) — CSP + nonce + CSRF
├── public/sw.js                          (6.2)
└── app/api/_csp-report/route.ts          (6.3)

scripts/
└── check-no-vault-leak.ts                (7.1) — مُفعَّل CI gate

packages/db/migrations/                   (8)
├── 0148__vault_items_encrypted.sql
├── 0149__audit_chain_db_hash.sql
├── 0150__oauth_state_store.sql
├── 0151__csp_reports.sql
├── 0152__csrf_tokens.sql
├── 0153__push_subscriptions.sql
├── 0154__device_registry.sql
├── 0155__outbox_dead_letter.sql
├── 0156__rls_pack_phase04.sql
└── 0157__lookup_public_share_fn.sql

docs/adr/
├── 0018__vault_crypto_xchacha20_argon2id.md
├── 0019__audit_chain_db_stored_hash.md
├── 0020__oauth_pkce_state_store.md
├── 0021__csp_strict_nonce.md
├── 0022__sw_offline_outbox_body_hash.md
└── 0023__migration_range_0148_0199.md   ← يوثّق سبب رفض 0300+

docs/execution/phase-04-outputs.md        (12)
docs/runbooks/rollback-phase-04.md        (13)
.env.example                              (يُحدَّث)
```

## 4. Preflight

قبل تنفيذ أي step، نفّذ ما يلي وأَوقِف العمل عند أي فشل:

```bash
# 1. التأكد من قفل المرحلة السابقة (Convention الموحَّد)
git tag --list | grep -E '^phase-03-locked$'
# يجب أن تخرج: phase-03-locked
# إذا فشل → ارجع لـ Phase 03 وأكمل القفل

# 2. التأكد من نطاق الـ migrations
ls packages/db/migrations/ | tail -5
# يجب آخر رقم: 0147

# 3. التأكد من توفر الـ exports من Phase 01/03
node -e "const s = require('@lifeos/shared'); console.log('envelopeOk:', typeof s.envelopeOk)"
# يجب: function
node -e "const p = require('@lifeos/permissions'); console.log('assertCapability:', typeof p.assertCapability)"
# يجب: function

# 4. إنشاء الفرع بـ Convention الموحَّد
git checkout -b phase/04-security phase-03-locked

# 5. تثبيت dependencies الجديدة
pnpm add -w @noble/ciphers@^1.0.0 @noble/hashes@^1.5.0
# سيُكتب في الـ workspace root + يُستهلَك من packages/vault-crypto
```

**Convention guards (لا تتجاوز):**

- ❌ ممنوع: `wave/*` branches، `wNN-frozen` tags، migration range `0300+`
- ✅ مطلوب: `phase/04-security`, `phase-04-locked`, migrations `0148..0199`

## 5. ADRs (6 جديدة)

### ADR-0018 — Vault crypto: XChaCha20-Poly1305 + Argon2id KDF

**القرار:** نستخدم XChaCha20-Poly1305 (من `@noble/ciphers/chacha`) لتشفير الـ payload، و Argon2id (من `@noble/hashes/argon2`) لاشتقاق master-key من password المستخدم.

**البدائل المرفوضة:**

- AES-256-GCM: nonce 96-bit يخاطر بالتصادم في الـ client-side scenarios طويلة العمر.
- PBKDF2: ضعيف ضد GPU brute-force.
- scrypt: أصعب لتمرير معاملات آمنة في browser.

**معاملات Argon2id:** `m=64MB, t=3, p=1, hashLen=32` (OWASP minimum).

### ADR-0019 — Audit chain: DB-stored hash + tamper detection

**القرار:** كل حدث audit له `event_hash` و `prev_hash` مخزَّنان في DB. الـ `verifyChain` يقرأ الـ hash من DB ويعيد حسابه من الـ payload للمقارنة، وليس من `ev.prevHash` فقط (الذي يمكن تزويره).

**السبب:** الثقة بـ `ev.prevHash` كقيمة محسوبة داخلياً تسمح بتزوير الـ payload + إعادة حساب الـ hash داخلياً. القاعدة: مقارنة مع DB-stored hash مستقل.

### ADR-0020 — OAuth: PKCE + DB-backed state store

**القرار:** PKCE (S256) إلزامي + state nonce يُخزَّن في `oauth_state_store` (TTL 10 دقائق) مع consume-once.

### ADR-0021 — CSP صارم + nonce لكل request

**القرار:** `default-src 'self'; script-src 'self' 'nonce-{NONCE}' 'strict-dynamic'; style-src 'self' 'nonce-{NONCE}'; report-uri /api/_csp-report`. لا `unsafe-inline`.

### ADR-0022 — Service Worker offline outbox + body-hash verification

**القرار:** كل عملية mutating offline تُضاف لـ outbox مع `bodyHash = SHA-256-hex(canonical_json(body))`. عند الـ sync، الـ SW يعيد حساب `bodyHash` ويقارنه قبل الإرسال (يمنع تلاعب الـ IndexedDB).

### ADR-0023 — Migration range 0148..0199 لـ Phase 04

**القرار:** نلتزم بتسلسل migrations المتصل. Phase 04 يستخدم 0148..0199 (مباشرة بعد Phase 03 range).

**Reserved ranges (موثَّقة):**

- 0001..0099: Phase 02 baseline
- 0100..0147: Phase 03
- 0148..0199: Phase 04 ← هذه المرحلة
- 0200..0299: Phase 05 (Zenith UI / search vectors)
- 0300+: غير مخصَّصة بعد

---

## 6. AppError codes الجديدة (11)

تُضاف لـ `packages/shared/src/errors/codes.ts` عبر declaration merging (نمط Phase 03 V1.1):

```tsx
// packages/shared/src/errors/phase-04-codes.ts
import type { ErrorCodeRegistry } from './registry';

declare module './registry' {
	interface ErrorCodeRegistry {
		VAULT_DECRYPT_FAILED: true;
		VAULT_MASTER_KEY_INVALID: true;
		VAULT_ITEM_KEY_INVALID: true;
		CSRF_TOKEN_INVALID: true;
		CSRF_TOKEN_MISSING: true;
		CSP_VIOLATION_REPORT: true;
		OFFLINE_NETWORK_UNAVAILABLE: true;
		OUTBOX_BODY_HASH_MISMATCH: true;
		AUDIT_CHAIN_BROKEN: true;
		OAUTH_STATE_INVALID: true;
		OAUTH_STATE_EXPIRED: true;
	}
}

export const PHASE_04_STATUS_MAP = {
	VAULT_DECRYPT_FAILED: 500,
	VAULT_MASTER_KEY_INVALID: 400,
	VAULT_ITEM_KEY_INVALID: 400,
	CSRF_TOKEN_INVALID: 403,
	CSRF_TOKEN_MISSING: 403,
	CSP_VIOLATION_REPORT: 400,
	OFFLINE_NETWORK_UNAVAILABLE: 503,
	OUTBOX_BODY_HASH_MISMATCH: 400,
	AUDIT_CHAIN_BROKEN: 500,
	OAUTH_STATE_INVALID: 400,
	OAUTH_STATE_EXPIRED: 410,
} as const;
```

**العدد التراكمي بعد Phase 04: 19 (Phase 03) + 11 = 30 AppError code.**

---

## Step 1 — packages/vault-crypto (المحتوى الكامل)

### 3.1 `packages/vault-crypto/package.json`

```json
{
	"name": "@lifeos/vault-crypto",
	"version": "0.1.0",
	"private": true,
	"main": "./src/index.ts",
	"types": "./src/index.ts",
	"dependencies": {
		"@noble/ciphers": "^1.0.0",
		"@noble/hashes": "^1.5.0",
		"@lifeos/shared": "workspace:*"
	},
	"devDependencies": {
		"typescript": "^5.5.0",
		"vitest": "^2.0.0"
	},
	"scripts": {
		"test": "vitest run",
		"typecheck": "tsc --noEmit"
	}
}
```

أضِف الـ package لـ `pnpm-workspace.yaml` (إذا كان يستخدم glob `packages/*` فهو مشمول تلقائياً) وإلى `tsconfig.json` references في الـ root.

### 3.2 `packages/vault-crypto/src/argon2.ts` (المحتوى الكامل — كان فارغاً في V1.0)

```tsx
import { argon2id } from '@noble/hashes/argon2';
import { randomBytes } from '@noble/hashes/utils';
import { AppError } from '@lifeos/shared';

/**
 * Argon2id parameters per OWASP 2024 minimum.
 * m=64MB, t=3, p=1 → ~250ms on a typical client device.
 */
export const ARGON2_PARAMS = {
	m: 64 * 1024,  // 64 MB in KiB
	t: 3,
	p: 1,
	dkLen: 32,     // 256-bit derived key
} as const;

export function generateSalt(): Uint8Array {
	return randomBytes(16);
}

export async function deriveMasterKey(
	password: string,
	salt: Uint8Array,
): Promise<Uint8Array> {
	if (password.length < 8) {
		throw new AppError('VAULT_MASTER_KEY_INVALID', 'Password too short.');
	}
	if (salt.length !== 16) {
		throw new AppError('VAULT_MASTER_KEY_INVALID', 'Salt must be 16 bytes.');
	}
	const key = await argon2id(
		new TextEncoder().encode(password),
		salt,
		ARGON2_PARAMS,
	);
	return key;
}
```

### 3.3 `packages/vault-crypto/src/xchacha20-poly1305.ts` (المحتوى الكامل — كان فارغاً في V1.0)

```tsx
import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { randomBytes } from '@noble/hashes/utils';
import { AppError } from '@lifeos/shared';

export const NONCE_SIZE = 24;  // XChaCha20 nonce
export const KEY_SIZE = 32;

export function generateNonce24(): Uint8Array {
	return randomBytes(NONCE_SIZE);
}

export function encrypt(
	key: Uint8Array,
	plaintext: Uint8Array,
	aad?: Uint8Array,
): { ciphertext: Uint8Array; nonce: Uint8Array } {
	if (key.length !== KEY_SIZE) {
		throw new AppError('VAULT_ITEM_KEY_INVALID', `Key must be ${KEY_SIZE} bytes.`);
	}
	const nonce = generateNonce24();
	const cipher = xchacha20poly1305(key, nonce, aad);
	const ciphertext = cipher.encrypt(plaintext);
	return { ciphertext, nonce };
}

export function decrypt(
	key: Uint8Array,
	ciphertext: Uint8Array,
	nonce: Uint8Array,
	aad?: Uint8Array,
): Uint8Array {
	if (key.length !== KEY_SIZE) {
		throw new AppError('VAULT_ITEM_KEY_INVALID', `Key must be ${KEY_SIZE} bytes.`);
	}
	if (nonce.length !== NONCE_SIZE) {
		throw new AppError('VAULT_DECRYPT_FAILED', `Nonce must be ${NONCE_SIZE} bytes.`);
	}
	try {
		const cipher = xchacha20poly1305(key, nonce, aad);
		return cipher.decrypt(ciphertext);
	} catch (e) {
		throw new AppError('VAULT_DECRYPT_FAILED', 'Auth tag mismatch or corrupt ciphertext.');
	}
}
```

### 3.4 `packages/vault-crypto/src/master-key.ts` (المحتوى الكامل — كان فارغاً في V1.0)

```tsx
import { deriveMasterKey, generateSalt, ARGON2_PARAMS } from './argon2';

export type MasterKeyRecord = {
	key: Uint8Array;       // never persisted; held in memory only
	saltBase64: string;    // persisted on the workspace record
	params: typeof ARGON2_PARAMS;
};

export async function createMasterKey(password: string): Promise<MasterKeyRecord> {
	const salt = generateSalt();
	const key = await deriveMasterKey(password, salt);
	return {
		key,
		saltBase64: Buffer.from(salt).toString('base64'),
		params: ARGON2_PARAMS,
	};
}

export async function unlockMasterKey(
	password: string,
	saltBase64: string,
): Promise<Uint8Array> {
	const salt = Buffer.from(saltBase64, 'base64');
	return deriveMasterKey(password, salt);
}
```

### 3.5 `packages/vault-crypto/src/item-key.ts` (المحتوى الكامل — كان فارغاً في V1.0)

```tsx
import { randomBytes } from '@noble/hashes/utils';
import { encrypt, decrypt, KEY_SIZE } from './xchacha20-poly1305';

/**
 * Item key: random 256-bit per vault item, encrypted by master key.
 * Envelope encryption pattern.
 */
export function generateItemKey(): Uint8Array {
	return randomBytes(KEY_SIZE);
}

export function wrapItemKey(
	masterKey: Uint8Array,
	itemKey: Uint8Array,
): { wrapped: Uint8Array; nonce: Uint8Array } {
	const { ciphertext, nonce } = encrypt(masterKey, itemKey);
	return { wrapped: ciphertext, nonce };
}

export function unwrapItemKey(
	masterKey: Uint8Array,
	wrapped: Uint8Array,
	nonce: Uint8Array,
): Uint8Array {
	return decrypt(masterKey, wrapped, nonce);
}
```

### 3.6 `packages/vault-crypto/src/envelope.ts`

```tsx
import { encrypt, decrypt } from './xchacha20-poly1305';
import { unwrapItemKey } from './item-key';

export type VaultEnvelope = {
	ciphertextBase64: string;
	nonceBase64: string;
	wrappedItemKeyBase64: string;
	itemKeyNonceBase64: string;
	aadBase64?: string;
};

export function sealEnvelope(
	masterKey: Uint8Array,
	itemKey: Uint8Array,
	plaintext: Uint8Array,
	aad?: Uint8Array,
): VaultEnvelope {
	const { ciphertext, nonce } = encrypt(itemKey, plaintext, aad);
	const { wrapped, nonce: itemKeyNonce } = (() => {
		const { ciphertext: w, nonce: n } = encrypt(masterKey, itemKey);
		return { wrapped: w, nonce: n };
	})();
	return {
		ciphertextBase64: Buffer.from(ciphertext).toString('base64'),
		nonceBase64: Buffer.from(nonce).toString('base64'),
		wrappedItemKeyBase64: Buffer.from(wrapped).toString('base64'),
		itemKeyNonceBase64: Buffer.from(itemKeyNonce).toString('base64'),
		aadBase64: aad ? Buffer.from(aad).toString('base64') : undefined,
	};
}

export function openEnvelope(
	masterKey: Uint8Array,
	env: VaultEnvelope,
): Uint8Array {
	const wrapped = Buffer.from(env.wrappedItemKeyBase64, 'base64');
	const itemKeyNonce = Buffer.from(env.itemKeyNonceBase64, 'base64');
	const itemKey = unwrapItemKey(masterKey, wrapped, itemKeyNonce);
	const ciphertext = Buffer.from(env.ciphertextBase64, 'base64');
	const nonce = Buffer.from(env.nonceBase64, 'base64');
	const aad = env.aadBase64 ? Buffer.from(env.aadBase64, 'base64') : undefined;
	return decrypt(itemKey, ciphertext, nonce, aad);
}
```

### 3.7 `packages/vault-crypto/src/index.ts`

```tsx
export * from './argon2';
export * from './xchacha20-poly1305';
export * from './master-key';
export * from './item-key';
export * from './envelope';
```

---

## Step 2 — packages/security

### 4.2 `packages/security/src/csp.ts`

```tsx
export function buildCspHeader(nonce: string, reportUri: string): string {
	return [
		`default-src 'self'`,
		`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
		`style-src 'self' 'nonce-${nonce}'`,
		`img-src 'self' data: blob:`,
		`font-src 'self'`,
		`connect-src 'self'`,
		`frame-ancestors 'none'`,
		`base-uri 'self'`,
		`form-action 'self'`,
		`object-src 'none'`,
		`upgrade-insecure-requests`,
		`report-uri ${reportUri}`,
	].join('; ');
}
```

### 4.3 `packages/security/src/nonce.ts` (إصلاح: Buffer.toString('base64url') — Node.js compatible)

```tsx
import { randomBytes } from 'node:crypto';

/**
 * 128-bit nonce, base64url-encoded.
 * Uses Node's randomBytes (works in middleware & SSR).
 * Avoids String.fromCharCode(...bytes) stack risk.
 */
export function generateNonce(): string {
	return randomBytes(16).toString('base64url');
}
```

### 4.4 `packages/security/src/csrf.ts` (إصلاح: timing-safe بدون length leak)

```tsx
import { timingSafeEqual, randomBytes } from 'node:crypto';
import { AppError } from '@lifeos/shared';

export function generateCsrfToken(): string {
	return randomBytes(32).toString('base64url');
}

export type VerifyCsrfParams = {
	cookieToken: string;
	bodyToken: string;
};

/**
 * Double-submit cookie CSRF verification.
 * Length difference is leaked-resistant: a dummy timingSafeEqual runs
 * even when lengths differ, equalizing wall-clock.
 */
export function verifyCsrf(params: VerifyCsrfParams): boolean {
	const a = Buffer.from(params.cookieToken, 'utf-8');
	const b = Buffer.from(params.bodyToken, 'utf-8');
	if (a.length !== b.length) {
		const dummy = Buffer.alloc(Math.max(a.length, 1));
		timingSafeEqual(dummy, dummy);  // burn constant time
		return false;
	}
	return timingSafeEqual(a, b);
}

export function assertCsrf(params: VerifyCsrfParams): void {
	if (!params.cookieToken || !params.bodyToken) {
		throw new AppError('CSRF_TOKEN_MISSING', 'CSRF token missing.');
	}
	if (!verifyCsrf(params)) {
		throw new AppError('CSRF_TOKEN_INVALID', 'CSRF token mismatch.');
	}
}
```

### 4.5 `packages/security/src/audit-chain.ts` (إصلاح: DB-stored hash + tamper detection)

```tsx
import { sha256 } from '@noble/hashes/sha2';
import { AppError, systemClock } from '@lifeos/shared';

export const GENESIS_HASH = '0'.repeat(64);

export type AuditEventInput = {
	workspaceId: string;
	actorId: string;
	eventType: string;
	payload: Record<string, unknown>;
	occurredAt: string;  // ISO
};

export type StoredAuditEvent = AuditEventInput & {
	id: string;
	prevHash: string;   // from DB
	eventHash: string;  // from DB
};

export function canonicalize(payload: Record<string, unknown>): string {
	const sortedKeys = Object.keys(payload).sort();
	const obj: Record<string, unknown> = {};
	for (const k of sortedKeys) obj[k] = payload[k];
	return JSON.stringify(obj);
}

export function computeEventHash(
	prevHash: string,
	ev: AuditEventInput,
): string {
	const material = [
		prevHash,
		ev.workspaceId,
		ev.actorId,
		ev.eventType,
		ev.occurredAt,
		canonicalize(ev.payload),
	].join('|');
	const h = sha256(new TextEncoder().encode(material));
	return Buffer.from(h).toString('hex');
}

/**
 * SECURE verification: recompute hash from payload + prevHash and compare
 * against DB-stored eventHash. A tampered payload yields a different hash,
 * even if the attacker also updated prevHash.
 *
 * Tamper detection works because the attacker would need to rewrite EVERY
 * subsequent event_hash in the DB — and the DB row is what we compare against,
 * not the incoming ev.prevHash blindly.
 */
export function verifyChain(events: StoredAuditEvent[]): boolean {
	let expectedPrev = GENESIS_HASH;
	for (const ev of events) {
		if (ev.prevHash !== expectedPrev) return false;
		const recomputed = computeEventHash(ev.prevHash, ev);
		if (recomputed !== ev.eventHash) return false;  // ← tamper detected
		expectedPrev = ev.eventHash;
	}
	return true;
}

export function assertChain(events: StoredAuditEvent[]): void {
	if (!verifyChain(events)) {
		throw new AppError('AUDIT_CHAIN_BROKEN', 'Audit chain verification failed.');
	}
}
```

### 4.6 `packages/security/src/scanner.ts` (مُفعَّل عبر CI gate)

```tsx
const SECRET_PATTERNS: { name: string; re: RegExp }[] = [
	{ name: 'AWS_ACCESS_KEY', re: /AKIA[0-9A-Z]{16}/g },
	{ name: 'GENERIC_API_KEY', re: /(?:api[_-]?key|apikey)['"\s:=]+[A-Za-z0-9_\-]{20,}/gi },
	{ name: 'PRIVATE_KEY_BLOCK', re: /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/g },
	{ name: 'JWT_LIKE', re: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
	{ name: 'STRIPE_LIVE', re: /sk_live_[A-Za-z0-9]{24,}/g },
	{ name: 'GH_PAT', re: /ghp_[A-Za-z0-9]{36,}/g },
];

export function scanTextForSecrets(file: string, text: string): string[] {
	const hits: string[] = [];
	for (const p of SECRET_PATTERNS) {
		const m = text.match(p.re);
		if (m) hits.push(`${file}: ${p.name} (${m.length} match${m.length === 1 ? '' : 'es'})`);
	}
	return hits;
}
```

### 4.7 `packages/security/src/oauth-state.ts`

```tsx
import { randomBytes, createHash } from 'node:crypto';
import { AppError } from '@lifeos/shared';

export function generateOAuthState(): string {
	return randomBytes(32).toString('base64url');
}

export function generatePkceVerifier(): string {
	return randomBytes(32).toString('base64url');
}

export function pkceChallengeS256(verifier: string): string {
	return createHash('sha256').update(verifier).digest('base64url');
}

export function assertOAuthState(
	stored: { state: string; expiresAt: Date } | null,
	incomingState: string,
	now: Date,
): void {
	if (!stored) throw new AppError('OAUTH_STATE_INVALID', 'Unknown state.');
	if (stored.expiresAt < now) throw new AppError('OAUTH_STATE_EXPIRED', 'State expired.');
	if (stored.state !== incomingState) throw new AppError('OAUTH_STATE_INVALID', 'State mismatch.');
}
```

### 4.8 `packages/security/src/index.ts`

```tsx
export * from './csp';
export * from './nonce';
export * from './csrf';
export * from './audit-chain';
export * from './scanner';
export * from './oauth-state';
```

---

## Step 3 — packages/offline

### 5.2 `packages/offline/src/outbox.ts`

```tsx
import { computeBodyHash } from './body-hash';
import { AppError, systemClock } from '@lifeos/shared';

export type OutboxRecord = {
	id: string;
	method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	url: string;
	headers: Record<string, string>;
	body: string;          // serialized JSON
	bodyHash: string;      // SHA-256 hex of canonical body
	attempts: number;
	nextAttemptAt: number; // epoch ms
	createdAt: number;
	lastError?: string;
};

export function buildOutboxRecord(
	input: Omit<OutboxRecord, 'bodyHash' | 'attempts' | 'nextAttemptAt' | 'createdAt'>,
): OutboxRecord {
	return {
		...input,
		bodyHash: computeBodyHash(input.body),
		attempts: 0,
		nextAttemptAt: systemClock.nowMs(),
		createdAt: systemClock.nowMs(),
	};
}

/**
 * Verify the outbox record was not tampered with in IndexedDB.
 * MUST be called before flushing to network.
 */
export function verifyOutboxIntegrity(rec: OutboxRecord): void {
	const expected = computeBodyHash(rec.body);
	if (expected !== rec.bodyHash) {
		throw new AppError('OUTBOX_BODY_HASH_MISMATCH', `Outbox record ${rec.id} integrity check failed.`);
	}
}
```

### 5.3 `packages/offline/src/body-hash.ts` (إصلاح: توثيق + implementation)

```tsx
import { sha256 } from '@noble/hashes/sha2';

/**
 * Canonical body hash for outbox integrity.
 *
 * The body is hashed as-stored (a UTF-8 string). Callers MUST canonicalize
 * JSON before storing (sorted keys) — do not rely on JSON.stringify ordering
 * being stable across runtimes.
 */
export function computeBodyHash(body: string): string {
	const h = sha256(new TextEncoder().encode(body));
	return Buffer.from(h).toString('hex');
}

export function canonicalJson(value: unknown): string {
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		return JSON.stringify(value);
	}
	const obj = value as Record<string, unknown>;
	const keys = Object.keys(obj).sort();
	const parts = keys.map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`);
	return `{${parts.join(',')}}`;
}
```

### 5.4 `packages/offline/src/backoff.ts` (إصلاح: injectable random)

```tsx
export function backoffMs(attempt: number, random: () => number = Math.random): number {
	const base = Math.min(60_000, 2 ** attempt * 1000);
	const jitter = Math.floor(random() * 500);
	return base + jitter;
}
```

### 5.5 `packages/offline/src/index.ts`

```tsx
export * from './outbox';
export * from './body-hash';
export * from './backoff';
```

---

## Step 4 — apps/web middleware + Service Worker

### 6.1 `apps/web/middleware.ts`

```tsx
import { NextRequest, NextResponse } from 'next/server';
import { generateNonce, buildCspHeader } from '@lifeos/security';
import { ServerEnv } from '@lifeos/shared';

export function middleware(req: NextRequest) {
	const nonce = generateNonce();
	const csp = buildCspHeader(nonce, ServerEnv.CSP_REPORT_URI);
	const res = NextResponse.next({ request: { headers: new Headers({
		...Object.fromEntries(req.headers),
		'x-csp-nonce': nonce,
	}) }});
	res.headers.set('Content-Security-Policy', csp);
	res.headers.set('X-Frame-Options', 'DENY');
	res.headers.set('X-Content-Type-Options', 'nosniff');
	res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	return res;
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 6.2 `apps/web/public/sw.js` (إصلاح: offline fallback + body-hash verify)

```jsx
const NEVER_CACHE_PATHS = ['/api/me', '/api/auth/', '/api/_csp-report'];

function shouldNeverCache(pathname) {
	return NEVER_CACHE_PATHS.some(p => pathname.startsWith(p));
}

function offlineResponse() {
	return new Response(
		JSON.stringify({
			ok: false,
			error: { code: 'OFFLINE_NETWORK_UNAVAILABLE', message: 'No network connection.' },
		}),
		{ status: 503, headers: { 'Content-Type': 'application/json' } },
	);
}

async function handleFetch(event) {
	const req = event.request;
	const url = new URL(req.url);
	if (shouldNeverCache(url.pathname)) {
		try {
			return await fetch(req);
		} catch {
			return offlineResponse();
		}
	}
	try {
		const networkRes = await fetch(req);
		return networkRes;
	} catch {
		const cached = await caches.match(req);
		if (cached) return cached;
		return offlineResponse();
	}
}

self.addEventListener('fetch', (event) => {
	event.respondWith(handleFetch(event));
});
```

### 6.3 `apps/web/app/api/_csp-report/route.ts`

```tsx
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@lifeos/shared';

export async function POST(req: NextRequest) {
	const body = await req.json().catch(() => ({}));
	logger.warn({ event: 'csp_violation', report: body });
	return new NextResponse(null, { status: 204 });
}
```

---

## Step 5 — تفعيل `scripts/check-no-vault-leak.ts` (كان placeholder في Phase 01)

```tsx
// scripts/check-no-vault-leak.ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { scanTextForSecrets } from '@lifeos/security';

const ROOT = process.cwd();
const IGNORED = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'coverage']);

function walk(dir: string, acc: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		if (IGNORED.has(name)) continue;
		const full = join(dir, name);
		const st = statSync(full);
		if (st.isDirectory()) walk(full, acc);
		else if (/\.(ts|tsx|js|jsx|json|env|sql|md)$/.test(name)) acc.push(full);
	}
	return acc;
}

const files = walk(ROOT);
const hits: string[] = [];
for (const f of files) {
	const rel = relative(ROOT, f);
	if (rel.startsWith('packages/security/src/scanner.ts')) continue;  // skip patterns file
	const text = readFileSync(f, 'utf-8');
	hits.push(...scanTextForSecrets(rel, text));
}
if (hits.length > 0) {
	console.error('Secret scanner FAILED:');
	for (const h of hits) console.error('  - ' + h);
	process.exit(1);
}
console.log('Secret scanner: OK');
```

**ربط CI** (في `.github/workflows/ci.yml`):

```yaml
- name: Secret leak check
  run: pnpm tsx scripts/check-no-vault-leak.ts
```

ويُضاف لـ `package.json` root scripts:

```json
"check:secrets": "tsx scripts/check-no-vault-leak.ts"
```

---

## Step 6 — Migrations (0148..0157)

### 0148 `vault_items_encrypted.sql`

```sql
BEGIN;

ALTER TABLE vault_items
	ADD COLUMN IF NOT EXISTS ciphertext_b64 TEXT,
	ADD COLUMN IF NOT EXISTS nonce_b64 TEXT,
	ADD COLUMN IF NOT EXISTS wrapped_item_key_b64 TEXT,
	ADD COLUMN IF NOT EXISTS item_key_nonce_b64 TEXT,
	ADD COLUMN IF NOT EXISTS aad_b64 TEXT,
	ADD COLUMN IF NOT EXISTS crypto_version SMALLINT NOT NULL DEFAULT 1
		CHECK (crypto_version > 0);

ALTER TABLE workspaces
	ADD COLUMN IF NOT EXISTS vault_master_salt_b64 TEXT,
	ADD COLUMN IF NOT EXISTS vault_kdf_params JSONB NOT NULL DEFAULT '{"alg":"argon2id","m":65536,"t":3,"p":1}'::jsonb;

INSERT INTO schema_migrations (version, phase, applied_at)
VALUES ('0148', '04', now());

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- ALTER TABLE vault_items DROP COLUMN IF EXISTS ciphertext_b64, ...;
-- ALTER TABLE workspaces DROP COLUMN IF EXISTS vault_master_salt_b64, vault_kdf_params;
-- DELETE FROM schema_migrations WHERE version='0148';
-- COMMIT;
```

### 0149 `audit_chain_db_hash.sql`

```sql
BEGIN;

ALTER TABLE workspace_audit_events
	ADD COLUMN IF NOT EXISTS prev_hash CHAR(64),
	ADD COLUMN IF NOT EXISTS event_hash CHAR(64);

-- Backfill: existing events get genesis chain.
UPDATE workspace_audit_events
SET prev_hash = repeat('0', 64),
    event_hash = encode(digest(
      concat_ws('|', repeat('0',64), workspace_id::text, actor_id::text, event_type, occurred_at::text, payload::text),
      'sha256'
    ), 'hex')
WHERE event_hash IS NULL;

ALTER TABLE workspace_audit_events
	ALTER COLUMN prev_hash SET NOT NULL,
	ALTER COLUMN event_hash SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_event_hash ON workspace_audit_events(event_hash);

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0149', '04', now());

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_audit_event_hash;
-- ALTER TABLE workspace_audit_events DROP COLUMN IF EXISTS prev_hash, event_hash;
-- DELETE FROM schema_migrations WHERE version='0149';
-- COMMIT;
```

### 0150 `oauth_state_store.sql`

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS oauth_state_store (
	state TEXT PRIMARY KEY,
	workspace_id UUID,
	user_id UUID,
	provider TEXT NOT NULL,
	pkce_verifier TEXT NOT NULL,
	redirect_to TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	expires_at TIMESTAMPTZ NOT NULL,
	consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_oauth_state_expires ON oauth_state_store(expires_at);

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0150', '04', now());

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP TABLE IF EXISTS oauth_state_store;
-- DELETE FROM schema_migrations WHERE version='0150';
-- COMMIT;
```

### 0151 `csp_reports.sql`

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS csp_reports (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id UUID,  -- nullable: report قد يأتي قبل auth
	report JSONB NOT NULL,
	user_agent TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csp_reports_workspace ON csp_reports(workspace_id, created_at DESC);

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0151', '04', now());

COMMIT;

-- ROLLBACK: DROP TABLE IF EXISTS csp_reports;
```

### 0152 `csrf_tokens.sql`

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS csrf_tokens (
	token TEXT PRIMARY KEY,
	session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_csrf_session ON csrf_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_csrf_expires ON csrf_tokens(expires_at);

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0152', '04', now());

COMMIT;

-- ROLLBACK: DROP TABLE IF EXISTS csrf_tokens;
```

### 0153 `push_subscriptions.sql`

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS push_subscriptions (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	endpoint TEXT NOT NULL,
	p256dh_key TEXT NOT NULL,
	auth_key TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	is_deleted BOOLEAN NOT NULL DEFAULT false,
	UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id) WHERE is_deleted = false;

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0153', '04', now());

COMMIT;

-- ROLLBACK: DROP TABLE IF EXISTS push_subscriptions;
```

### 0154 `device_registry.sql`

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS device_registry (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	device_fingerprint TEXT NOT NULL,
	user_agent TEXT,
	first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	revoked_at TIMESTAMPTZ,
	UNIQUE (user_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_device_user ON device_registry(user_id) WHERE revoked_at IS NULL;

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0154', '04', now());

COMMIT;

-- ROLLBACK: DROP TABLE IF EXISTS device_registry;
```

### 0155 `outbox_dead_letter.sql`

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS outbox_dead_letter (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	original_id TEXT NOT NULL,
	method TEXT NOT NULL,
	url TEXT NOT NULL,
	body TEXT NOT NULL,
	body_hash CHAR(64) NOT NULL,
	attempts INTEGER NOT NULL,
	last_error TEXT,
	failed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dead_letter_workspace ON outbox_dead_letter(workspace_id, failed_at DESC);

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0155', '04', now());

COMMIT;

-- ROLLBACK: DROP TABLE IF EXISTS outbox_dead_letter;
```

### 0156 `rls_pack_phase04.sql` (تفصيل كامل لكل جدول)

```sql
BEGIN;

-- csp_reports: nullable workspace_id (reports قد تكون pre-auth)
-- لذلك RLS بسيطة: المستخدم يقرأ تقارير workspace فقط، الكتابة مفتوحة (system)
ALTER TABLE csp_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE csp_reports FORCE ROW LEVEL SECURITY;
CREATE POLICY csp_reports_select ON csp_reports FOR SELECT
	USING (workspace_id IS NULL OR workspace_id = current_setting('app.workspace_id', true)::uuid);
CREATE POLICY csp_reports_insert ON csp_reports FOR INSERT WITH CHECK (true);

-- csrf_tokens: scoped by session → indirectly by user
ALTER TABLE csrf_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE csrf_tokens FORCE ROW LEVEL SECURITY;
CREATE POLICY csrf_tokens_all ON csrf_tokens FOR ALL
	USING (
		EXISTS (
			SELECT 1 FROM sessions s
			WHERE s.id = csrf_tokens.session_id
			  AND s.user_id = current_setting('app.user_id', true)::uuid
		)
	);

-- push_subscriptions: workspace_id tenant-scoped
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions FORCE ROW LEVEL SECURITY;
CREATE POLICY push_subs_all ON push_subscriptions FOR ALL
	USING (workspace_id = current_setting('app.workspace_id', true)::uuid);

-- device_registry: workspace_id tenant-scoped + user can only see own devices
ALTER TABLE device_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_registry FORCE ROW LEVEL SECURITY;
CREATE POLICY device_registry_all ON device_registry FOR ALL
	USING (
		workspace_id = current_setting('app.workspace_id', true)::uuid
		AND user_id = current_setting('app.user_id', true)::uuid
	);

-- outbox_dead_letter: workspace_id tenant-scoped
ALTER TABLE outbox_dead_letter ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_dead_letter FORCE ROW LEVEL SECURITY;
CREATE POLICY outbox_dl_all ON outbox_dead_letter FOR ALL
	USING (workspace_id = current_setting('app.workspace_id', true)::uuid);

-- oauth_state_store: لا RLS (pre-auth flow)، الحماية عبر TTL + consume-once
-- نُبقيها بدون RLS لكن نُضيف cleanup job

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0156', '04', now());

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP POLICY IF EXISTS csp_reports_select ON csp_reports;
-- DROP POLICY IF EXISTS csp_reports_insert ON csp_reports;
-- ALTER TABLE csp_reports DISABLE ROW LEVEL SECURITY;
-- ... (نفس للجداول الأخرى)
-- DELETE FROM schema_migrations WHERE version='0156';
-- COMMIT;
```

### 0157 `lookup_public_share_fn.sql`

```sql
BEGIN;

CREATE OR REPLACE FUNCTION lookup_public_share(p_token TEXT)
RETURNS TABLE (
	workspace_id UUID,
	resource_type TEXT,
	resource_id UUID,
	expires_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
	RETURN QUERY
	SELECT s.workspace_id, s.resource_type, s.resource_id, s.expires_at
	FROM public_shares s
	WHERE s.token = p_token
	  AND (s.expires_at IS NULL OR s.expires_at > now())
	  AND s.revoked_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION lookup_public_share(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION lookup_public_share(TEXT) TO authenticated, anon;

INSERT INTO schema_migrations (version, phase, applied_at) VALUES ('0157', '04', now());

COMMIT;

-- ROLLBACK: DROP FUNCTION IF EXISTS lookup_public_share(TEXT);
```

**ملاحظة:** `scripts/migrate.ts` (من Phase 02) يفحص continuity. لا يسمح بتشغيل 0148 قبل تطبيق 0147، ولا 0156 قبل 0155. لا حاجة لتعديله.

---

## Step 7 — مثال route كامل يستخدم كل القطع

```tsx
// apps/web/app/api/vault/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/web';
import { envelopeOk } from '@lifeos/shared';
import { assertCsrf } from '@lifeos/security';
import { assertCapability } from '@lifeos/permissions';
import { sealEnvelope } from '@lifeos/vault-crypto';

export const POST = withWorkspaceRoute(async ({ req, workspaceId, userId, role }) => {
	assertCsrf({
		cookieToken: req.cookies.get('lifeos_csrf')?.value ?? '',
		bodyToken: req.headers.get('x-csrf-token') ?? '',
	});
	assertCapability({ userId, workspaceId, role }, 'vault.write');

	// ... read body, seal envelope, insert via VaultRepo
	return NextResponse.json(envelopeOk({ ok: true }));
});
```

**ملاحظات حرجة:**

- ✅ `envelopeOk` (الاسم الصحيح من Phase 01) — ليس `okEnvelope`
- ✅ `withWorkspaceRoute` يمرر `role` كما في Phase 03 Step 28
- ✅ `assertCapability` من `@lifeos/permissions` — ليس `resolver.assertCapability`

---

## Step 8 — اختبارات pgTAP لـ RLS الجديدة

```sql
-- tests/pgtap/0156_rls_phase04.sql
BEGIN;
SELECT plan(10);

-- استخدم helper من Phase 03: _test_seed_row(p_sql)
SELECT _test_seed_row($$
	INSERT INTO csp_reports (workspace_id, report) VALUES ('00000000-0000-0000-0000-000000000001', '{"x":1}'::jsonb);
$$);

-- 1. user من workspace آخر لا يرى التقرير
SELECT set_config('app.workspace_id', '00000000-0000-0000-0000-000000000002', true);
SELECT set_config('app.user_id', '00000000-0000-0000-0000-000000000010', true);
SELECT is(
	(SELECT count(*)::int FROM csp_reports),
	0,
	'csp_reports: cross-workspace read blocked'
);

-- 2. user من نفس workspace يرى التقرير
SELECT set_config('app.workspace_id', '00000000-0000-0000-0000-000000000001', true);
SELECT is(
	(SELECT count(*)::int FROM csp_reports),
	1,
	'csp_reports: same-workspace read allowed'
);

-- ... 8 اختبارات أخرى للجداول 4 الباقية (push, device, dead-letter, csrf)

SELECT * FROM finish();
ROLLBACK;
```

---

## Step 9 — checklist التنفيذ

- [ ]  **Preflight**: تاج `phase-03-locked` موجود، آخر migration = 0147، فرع `phase/04-security` منشأ من التاج
- [ ]  `pnpm add -w @noble/ciphers@^1.0.0 @noble/hashes@^1.5.0`
- [ ]  إنشاء `packages/vault-crypto` بكل ملفاته الـ 7 (3.1..3.7) — **لا ملف فارغ**
- [ ]  إنشاء `packages/security` بكل ملفاته الـ 7 (4.1..4.8)
- [ ]  إنشاء `packages/offline` بكل ملفاته الـ 4 (5.1..5.5)
- [ ]  `apps/web/middleware.ts` + `apps/web/public/sw.js` + `/api/_csp-report/route.ts`
- [ ]  تفعيل `scripts/check-no-vault-leak.ts` + ربطه بـ CI workflow
- [ ]  تطبيق migrations 0148..0157 بالترتيب عبر `scripts/migrate.ts`
- [ ]  إضافة 11 AppError code عبر declaration merging
- [ ]  كتابة pgTAP tests لـ 5 جداول RLS
- [ ]  كتابة Vitest tests لـ argon2, envelope, round-trip, csrf, audit-chain, scanner, body-hash, backoff
- [ ]  تشغيل `pnpm typecheck` + `pnpm test` + `pnpm check:secrets` — كلها passing
- [ ]  تشغيل `pgtap` على DB staging
- [ ]  كتابة `docs/execution/phase-04-outputs.md`
- [ ]  كتابة `docs/runbooks/rollback-phase-04.md`
- [ ]  تحديث `.env.example` بـ `VAULT_PEPPER`, `CSRF_SECRET`, `CSP_REPORT_URI=/api/_csp-report`, `OAUTH_STATE_TTL_MINUTES=10`
- [ ]  commit + push + `git tag -a phase-04-locked -m "Phase 04 locked V1.1"`

---

## Step 10 — Definition of Done

1. ✅ 6 ADRs جديدة (0018..0023) موجودة في `docs/adr/`
2. ✅ 11 AppError codes مضافة عبر declaration merging — `pnpm typecheck` يكتشف أي misuse
3. ✅ 3 packages workspace جديدة (`vault-crypto`, `security`, `offline`) كلها typecheck + tests passing
4. ✅ 10 migrations 0148..0157 مطبَّقة، `schema_migrations` يحتوي 10 صفوف بـ `phase='04'`
5. ✅ pgTAP RLS tests = 10 passing لكل من csp_reports/csrf_tokens/push_subscriptions/device_registry/outbox_dead_letter
6. ✅ `apps/web/middleware.ts` يضع CSP nonce + headers صحيحة
7. ✅ Service Worker يرجع 503 + `OFFLINE_NETWORK_UNAVAILABLE` عند offline (وليس throws)
8. ✅ `pnpm check:secrets` يمر بدون hits على الـ codebase
9. ✅ كل route جديد يستخدم `envelopeOk` (الاسم الصحيح) + `withWorkspaceRoute({ role })` + `assertCapability` من `@lifeos/permissions`
10. ✅ `git tag -l phase-04-locked` يخرج النتيجة
11. ✅ `docs/execution/phase-04-outputs.md` يحتوي على القيم النهائية للمرحلة القادمة
12. ✅ Convention compliance: لا `wave/*` branches، لا `wNN-frozen` tags، لا migrations 0300+

---

## Step 11 — سجل القرارات (Decisions)

| المعرف | القرار | المرحلة |
| --- | --- | --- |
| D-054 | توحيد convention: branch `phase/NN-name`  • tag `phase-NN-locked` (إلغاء `wave/*` و `wNN-frozen`) | 04 |
| D-055 | Migration ranges مُسجَّلة (ADR-0023): 0148..0199 لـ Phase 04، 0200..0299 محجوزة لـ Phase 05 | 04 |
| D-056 | XChaCha20-Poly1305 + Argon2id لكل crypto vault (ADR-0018) | 04 |
| D-057 | Audit chain hash مخزَّن في DB، `verifyChain` يعيد حساب الـ hash من الـ payload (tamper detection حقيقي) (ADR-0019) | 04 |
| D-058 | OAuth: PKCE S256 + state DB-backed مع consume-once (ADR-0020) | 04 |
| D-059 | CSP صارم، nonce لكل request، `report-uri /api/_csp-report` (ADR-0021) | 04 |
| D-060 | Service Worker offline: outbox مع `bodyHash = SHA-256-hex(canonical_json(body))`، verify قبل الـ flush (ADR-0022) | 04 |
| D-061 | CSRF: double-submit cookie + `timingSafeEqual` بدون length leak (dummy compare عند اختلاف الطول) | 04 |
| D-062 | `generateNonce` يستخدم `node:crypto.randomBytes(16).toString('base64url')` — متوافق مع Node middleware | 04 |
| D-063 | `backoffMs(attempt, random?)` injectable RNG للـ tests | 04 |
| D-064 | `scripts/check-no-vault-leak.ts` مُفعَّل كـ CI gate إلزامي (كان placeholder في Phase 01) | 04 |
| D-065 | كل routes جديدة تستخدم `envelopeOk` (ليس `okEnvelope`) و `withWorkspaceRoute({ role })` | 04 |
| D-066 | RLS موثَّقة جدولاً جدولاً في 0156: csp_reports / csrf_tokens / push_subscriptions / device_registry / outbox_dead_letter | 04 |
| D-067 | 11 AppError codes جديدة عبر `declare module './registry'` (ErrorCodeRegistry declaration merging) | 04 |

---

## Step 12 — [phase-04-outputs.md](http://phase-04-outputs.md) (يُكتب في نهاية المرحلة)

```markdown
# Phase 04 Outputs (V1.1)

## A. Migrations Applied
0148..0157 (10 migrations). schema_migrations rows = 10 with phase='04'.
**Next available migration number: 0158.**
**Reserved for Phase 04 patches: 0158..0199.**
**Reserved for Phase 05: 0200..0299.**

## B. New Workspace Packages
- `@lifeos/vault-crypto` (XChaCha20-Poly1305 + Argon2id envelope encryption)
- `@lifeos/security` (CSP, CSRF, audit-chain, scanner, oauth-state)
- `@lifeos/offline` (outbox, body-hash, backoff)

## C. New AppError Codes (11)
VAULT_DECRYPT_FAILED (500), VAULT_MASTER_KEY_INVALID (400), VAULT_ITEM_KEY_INVALID (400),
CSRF_TOKEN_INVALID (403), CSRF_TOKEN_MISSING (403), CSP_VIOLATION_REPORT (400),
OFFLINE_NETWORK_UNAVAILABLE (503), OUTBOX_BODY_HASH_MISMATCH (400),
AUDIT_CHAIN_BROKEN (500), OAUTH_STATE_INVALID (400), OAUTH_STATE_EXPIRED (410).

Cumulative total after Phase 04: 30 codes.

## D. New Tables
- oauth_state_store, csp_reports, csrf_tokens, push_subscriptions, device_registry, outbox_dead_letter

## E. Modified Tables
- vault_items (+6 columns), workspaces (+2 columns), workspace_audit_events (+2 hash columns)

## F. New Conventions for Phase 05+
- Use `envelopeOk` (NEVER `okEnvelope`)
- `withWorkspaceRoute(async ({ req, workspaceId, userId, role }) => ...)` — `role` is always passed
- `assertCapability` imported from `@lifeos/permissions`
- All offline mutations go through `buildOutboxRecord` (computes bodyHash)
- All audit events written via `computeEventHash(prevHash, ev)` and stored with `event_hash` column
- CSP nonce is read from `x-csp-nonce` request header in Next.js components
- Branch naming: `phase/NN-short-name`. Tag: `phase-NN-locked` (annotated).

## G. ADRs Added
0018 (vault crypto), 0019 (audit chain DB hash), 0020 (OAuth PKCE),
0021 (CSP strict nonce), 0022 (SW offline body-hash), 0023 (migration range 0148..0199).

Cumulative ADRs after Phase 04: 8 (Phase 03) + 6 = 14.

## H. CI Gates Activated
- `pnpm check:secrets` (was Phase 01 placeholder, now enforced)
- `pnpm test` includes pgTAP RLS tests for 5 new tables
- `pnpm typecheck` enforces 11 new ErrorCodeRegistry entries
```

---

## Step 13 — [rollback-phase-04.md](http://rollback-phase-04.md) (خلاصة)

```markdown
# Phase 04 Rollback Runbook

## Order (reverse of apply)
1. `pnpm tsx scripts/rollback-migration.ts 0157` ... down to `0148`
2. `git revert <merge-commit>` للـ packages الـ 3
3. `git tag -d phase-04-locked` + `git push origin :refs/tags/phase-04-locked`
4. Re-deploy from `phase-03-locked` tag

## Per-migration rollback SQL
(انظر `-- ROLLBACK:` footer في كل ملف migration)

## Data preservation
vault_items rows مع `ciphertext_b64 = NULL` تبقى — التعديل additive.
workspace_audit_events: `prev_hash`/`event_hash` تُحذف، الـ chain يُعاد بناؤه عند rerun.
```

---

## Step 14 — ملاحظات للـ Executor (AI أو إنسان)

1. **ابدأ بالـ Preflight بالكامل** — لا تتجاوز أي guard.
2. **أنشئ الـ packages بالترتيب**: vault-crypto → security → offline. كل package يجب أن يجتاز `pnpm typecheck` قبل الانتقال للتالي.
3. **لا تترك أي ملف فارغ**. كل ملف مذكور في §3 له محتوى كامل في الـ steps. إذا كان الـ AI executor يولّد ملف، يجب أن يكون شامل الـ imports + الـ exports.
4. **استخدم `assertCapability` من `@lifeos/permissions` مباشرة**. لا تستورد `resolver` أبداً.
5. **استخدم `envelopeOk` من `@lifeos/shared`**. لا `okEnvelope`.
6. **عند كتابة pgTAP** استخدم `_test_seed_row(p_sql)` helper من Phase 03 V1.1. لا `SET LOCAL row_security`.
7. **عند كتابة audit event** نَفِّذ `computeEventHash(prevHash, ev)` قبل INSERT واحفظ النتيجة في `event_hash`.
8. **عند كتابة outbox record** نَفِّذ `buildOutboxRecord({...})` ولا تنشئ الحقل يدوياً.
9. **عند تشغيل migrations** استخدم `scripts/migrate.ts` فقط — لا تشغّل psql مباشرة.
10. **عند الإنتهاء**: `git tag -a phase-04-locked -m "Phase 04 V1.1 locked"` + `git push --tags`.

---

*نهاية مرحلة 4.*