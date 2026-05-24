import { deriveMasterKey, generateSalt, ARGON2_PARAMS } from './argon2';

export type MasterKeyRecord = {
	key: Uint8Array; // never persisted; held in memory only
	saltBase64: string; // persisted on the workspace record
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
	return deriveMasterKey(password, new Uint8Array(salt));
}
