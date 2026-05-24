import { randomBytes } from 'node:crypto';

/**
 * 128-bit nonce, base64url-encoded.
 * Uses Node's randomBytes (works in middleware & SSR).
 * Avoids String.fromCharCode(...bytes) stack risk.
 */
export function generateNonce(): string {
	return randomBytes(16).toString('base64url');
}
