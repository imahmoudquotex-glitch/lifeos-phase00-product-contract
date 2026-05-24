import { assertCapability, type Actor } from '@lifeos/permissions';
import type { DbClient } from '@lifeos/db';
import { DailyReviewRepo, type DailyReview } from './daily-review.repo';

export class DailyReviewService {
	private readonly repo: DailyReviewRepo;

	constructor(db: DbClient) {
		this.repo = new DailyReviewRepo(db);
	}

	async write(actor: Actor, input: { reviewDate: string; mood?: number; summaryMd?: string }): Promise<DailyReview> {
		assertCapability(actor, 'review:write');
		return this.repo.upsert({
			workspaceId: actor.workspaceId,
			userId: actor.userId,
			...input,
		});
	}
}
