import type { DbClient } from '@lifeos/db';

export class WebhookNonceRepo {
	constructor(private readonly db: DbClient) {}

	/**
	 * Returns true if nonce was newly recorded.
	 * Returns false if already seen (replay attack).
	 */
	async recordIfNew(nonce: string, provider: string): Promise<boolean> {
		try {
			await this.db.none(
				`INSERT INTO webhook_nonces (nonce, provider) VALUES ($1, $2)`,
				[nonce, provider],
			);
			return true;
		} catch (e: unknown) {
			if (
				typeof e === 'object' && e !== null &&
				'code' in e && (e as { code: string }).code === '23505'
			) {
				return false;
			}
			throw e;
		}
	}
}
