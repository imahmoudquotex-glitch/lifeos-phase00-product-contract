import { argon2id } from '@noble/hashes/argon2';
import { randomBytes } from '@noble/hashes/utils';
import { AppError } from '@lifeos/shared';

/**
 * Argon2id parameters per OWASP 2024 minimum.
 * m=64MB, t=3, p=1 → ~250ms on a typical client device.
 */
export const ARGON2_PARAMS = {
	m: 64 * 1024, // 64 MB in KiB
	t: 3,
	p: 1,
	dkLen: 32, // 256-bit derived key
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
	const key = argon2id(new TextEncoder().encode(password), salt, ARGON2_PARAMS);
	return key;
}
