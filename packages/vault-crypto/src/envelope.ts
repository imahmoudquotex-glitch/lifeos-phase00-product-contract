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
	const { ciphertext: wrapped, nonce: itemKeyNonce } = encrypt(masterKey, itemKey);
	return {
		ciphertextBase64: Buffer.from(ciphertext).toString('base64'),
		nonceBase64: Buffer.from(nonce).toString('base64'),
		wrappedItemKeyBase64: Buffer.from(wrapped).toString('base64'),
		itemKeyNonceBase64: Buffer.from(itemKeyNonce).toString('base64'),
		...(aad ? { aadBase64: Buffer.from(aad).toString('base64') } : {}),
	};
}

export function openEnvelope(
	masterKey: Uint8Array,
	env: VaultEnvelope,
): Uint8Array {
	const wrapped = Buffer.from(env.wrappedItemKeyBase64, 'base64');
	const itemKeyNonce = Buffer.from(env.itemKeyNonceBase64, 'base64');
	const itemKey = unwrapItemKey(masterKey, new Uint8Array(wrapped), new Uint8Array(itemKeyNonce));
	const ciphertext = Buffer.from(env.ciphertextBase64, 'base64');
	const nonce = Buffer.from(env.nonceBase64, 'base64');
	const aad = env.aadBase64 ? Buffer.from(env.aadBase64, 'base64') : undefined;
	return decrypt(itemKey, new Uint8Array(ciphertext), new Uint8Array(nonce), aad ? new Uint8Array(aad) : undefined);
}
