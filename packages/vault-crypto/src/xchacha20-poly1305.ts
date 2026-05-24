import { xchacha20poly1305 } from '@noble/ciphers/chacha';
import { randomBytes } from '@noble/hashes/utils';
import { AppError } from '@lifeos/shared';

export const NONCE_SIZE = 24; // XChaCha20 nonce
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
	} catch (_e) {
		throw new AppError('VAULT_DECRYPT_FAILED', 'Auth tag mismatch or corrupt ciphertext.');
	}
}
