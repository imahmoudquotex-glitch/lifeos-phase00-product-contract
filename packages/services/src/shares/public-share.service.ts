import { AppError, newUlid } from '@lifeos/shared';
import { assertCapability, type Actor } from '@lifeos/permissions';
import type { DbClient } from '@lifeos/db';
import { PublicShareRepo, type PublicShare } from './public-share.repo';

export class PublicShareService {
	private readonly repo: PublicShareRepo;

	constructor(db: DbClient) {
		this.repo = new PublicShareRepo(db);
	}

	async create(actor: Actor, input: {
		resourceType: 'page' | 'note';
		resourceId: string;
		expiresAt?: Date;
	}): Promise<{ share: PublicShare; rawToken: string }> {
		assertCapability(actor, 'share:create');
		const rawToken = newUlid();
		const share = await this.repo.create({
			workspaceId: actor.workspaceId,
			createdBy: actor.userId,
			rawToken,
			...input,
		});
		return { share, rawToken };
	}

	async revoke(actor: Actor, id: string): Promise<void> {
		assertCapability(actor, 'share:revoke');
		const ok = await this.repo.revoke(id, actor.workspaceId);
		if (!ok) throw new AppError('PUBLIC_SHARE_NOT_FOUND', 'Public share not found.');
	}
}
