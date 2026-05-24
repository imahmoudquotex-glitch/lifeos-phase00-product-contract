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
