import { describe, expect, it } from 'vitest';
import { createMasterKey, unlockMasterKey } from '../src/master-key';
import { generateItemKey, wrapItemKey, unwrapItemKey } from '../src/item-key';
import { sealEnvelope, openEnvelope } from '../src/envelope';

describe('Full vault round-trip', () => {
	it('create → lock → unlock → seal → open', async () => {
		const password = 'MySecurePassword!1';

		// 1. Create master key from password
		const { key: masterKey, saltBase64 } = await createMasterKey(password);
		expect(masterKey.length).toBe(32);

		// 2. Generate and wrap an item key
		const itemKey = generateItemKey();
		const { wrapped, nonce: wrapNonce } = wrapItemKey(masterKey, itemKey);

		// 3. Unlock master key with same password + salt
		const unlockedMaster = await unlockMasterKey(password, saltBase64);
		expect(Buffer.from(unlockedMaster).toString('hex')).toBe(
			Buffer.from(masterKey).toString('hex'),
		);

		// 4. Unwrap item key
		const recoveredItemKey = unwrapItemKey(
			unlockedMaster,
			new Uint8Array(wrapped),
			new Uint8Array(wrapNonce),
		);
		expect(Buffer.from(recoveredItemKey).toString('hex')).toBe(
			Buffer.from(itemKey).toString('hex'),
		);

		// 5. Seal and open an envelope
		const plaintext = new TextEncoder().encode('{"username":"alice","password":"hunter2"}');
		const env = sealEnvelope(masterKey, itemKey, plaintext);
		const recovered = openEnvelope(masterKey, env);
		expect(new TextDecoder().decode(recovered)).toBe('{"username":"alice","password":"hunter2"}');
	}, 30000);
});
