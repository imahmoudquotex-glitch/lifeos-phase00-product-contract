import { assertCapability, type Actor } from '@lifeos/permissions';
import type { DbClient } from '@lifeos/db';
import { XpRepo, type XpEvent } from './xp.repo';

export class XpService {
	private readonly repo: XpRepo;

	constructor(db: DbClient) {
		this.repo = new XpRepo(db);
	}

	async award(actor: Actor, input: { source: string; delta: number; metadata?: Record<string, unknown> }): Promise<XpEvent> {
		assertCapability(actor, 'xp:award');
		return this.repo.award({
			workspaceId: actor.workspaceId,
			userId: actor.userId,
			...input,
		});
	}

	async getTotal(actor: Actor): Promise<number> {
		assertCapability(actor, 'xp:award');
		return this.repo.sumByUser(actor.workspaceId, actor.userId);
	}
}
