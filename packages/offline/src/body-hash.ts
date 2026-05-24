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
	const parts = keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`);
	return `{${parts.join(',')}}`;
}
