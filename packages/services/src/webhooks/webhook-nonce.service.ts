import { AppError } from '@lifeos/shared';
import type { DbClient } from '@lifeos/db';
import { WebhookNonceRepo } from './webhook-nonce.repo';

export class WebhookNonceService {
	private readonly repo: WebhookNonceRepo;

	constructor(db: DbClient) {
		this.repo = new WebhookNonceRepo(db);
	}

	/** Call before processing any webhook. Throws WEBHOOK_NONCE_REUSED if replay. */
	async consumeOrThrow(nonce: string, provider: string): Promise<void> {
		const isNew = await this.repo.recordIfNew(nonce, provider);
		if (!isNew) {
			throw new AppError('WEBHOOK_NONCE_REUSED', 'Webhook nonce has already been used.');
		}
	}
}
