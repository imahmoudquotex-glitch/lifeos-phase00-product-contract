/**
 * Phase 04 AppError codes — declared via module augmentation.
 * Import this file once (e.g. in apps/web entry) to register the codes.
 */
declare module './codes' {
	interface ErrorCodeRegistry {
		// Vault crypto errors
		VAULT_DECRYPT_FAILED: true;
		VAULT_MASTER_KEY_INVALID: true;
		VAULT_ITEM_KEY_INVALID: true;
		// CSRF
		CSRF_TOKEN_INVALID: true;
		CSRF_TOKEN_MISSING: true;
		// CSP
		CSP_VIOLATION_REPORT: true;
		// Offline / outbox
		OFFLINE_NETWORK_UNAVAILABLE: true;
		OUTBOX_BODY_HASH_MISMATCH: true;
		// Audit chain
		AUDIT_CHAIN_BROKEN: true;
		// OAuth
		OAUTH_STATE_INVALID: true;
		OAUTH_STATE_EXPIRED: true;
	}
}

import type { ErrorCode } from './codes';

export const PHASE_04_STATUS_MAP: Partial<Record<string, number>> = {
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

export const PHASE_04_ERROR_CODES = [
	'VAULT_DECRYPT_FAILED',
	'VAULT_MASTER_KEY_INVALID',
	'VAULT_ITEM_KEY_INVALID',
	'CSRF_TOKEN_INVALID',
	'CSRF_TOKEN_MISSING',
	'CSP_VIOLATION_REPORT',
	'OFFLINE_NETWORK_UNAVAILABLE',
	'OUTBOX_BODY_HASH_MISMATCH',
	'AUDIT_CHAIN_BROKEN',
	'OAUTH_STATE_INVALID',
	'OAUTH_STATE_EXPIRED',
] as const;

export type Phase04ErrorCode = (typeof PHASE_04_ERROR_CODES)[number];
