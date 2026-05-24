import { describe, expect, it } from 'vitest';
import { deriveMasterKey, generateSalt, ARGON2_PARAMS } from '../src/argon2';
import { AppError } from '@lifeos/shared';

describe('deriveMasterKey', () => {
	it('returns 32 bytes for valid inputs', async () => {
		const salt = generateSalt();
		const key = await deriveMasterKey('password123', salt);
		expect(key).toBeInstanceOf(Uint8Array);
		expect(key.length).toBe(ARGON2_PARAMS.dkLen);
	});

	it('throws VAULT_MASTER_KEY_INVALID for short password', async () => {
		const salt = generateSalt();
		await expect(deriveMasterKey('short', salt)).rejects.toMatchObject({
			code: 'VAULT_MASTER_KEY_INVALID',
		});
	});

	it('throws VAULT_MASTER_KEY_INVALID for wrong salt length', async () => {
		await expect(deriveMasterKey('password123', new Uint8Array(8))).rejects.toMatchObject({
			code: 'VAULT_MASTER_KEY_INVALID',
		});
	});

	it('is deterministic: same password+salt → same key', async () => {
		const salt = generateSalt();
		const a = await deriveMasterKey('mypassword', salt);
		const b = await deriveMasterKey('mypassword', salt);
		expect(Buffer.from(a).toString('hex')).toBe(Buffer.from(b).toString('hex'));
	});
}, 30000); // Argon2id is slow — 30s timeout
