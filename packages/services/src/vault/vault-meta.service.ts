import { AppError } from '@lifeos/shared';
import { assertCapability, type Actor } from '@lifeos/permissions';
import type { DbClient } from '@lifeos/db';
import { VaultMetaRepo } from './vault-meta.repo';
import type { VaultItemMeta, VaultItemType } from './vault.types';

export class VaultMetaService {
	private readonly repo: VaultMetaRepo;

	constructor(db: DbClient) {
		this.repo = new VaultMetaRepo(db);
	}

	async createMeta(actor: Actor, input: {
		itemType: VaultItemType;
		titleHash: string;
		tags?: string[];
	}): Promise<VaultItemMeta> {
		assertCapability(actor, 'vault:create-meta');
		return this.repo.create({
			workspaceId: actor.workspaceId,
			ownerUserId: actor.userId,
			...input,
		});
	}

	async getMeta(actor: Actor, id: string): Promise<VaultItemMeta> {
		assertCapability(actor, 'vault:read-meta');
		const item = await this.repo.findByIdAndOwner(id, actor.workspaceId, actor.userId);
		if (!item) throw new AppError('VAULT_ITEM_NOT_FOUND', 'Vault item not found.');
		return item;
	}

	async delete(actor: Actor, id: string): Promise<void> {
		assertCapability(actor, 'vault:create-meta');
		const ok = await this.repo.softDeleteOwned(id, actor.workspaceId, actor.userId);
		if (!ok) throw new AppError('VAULT_ITEM_NOT_FOUND', 'Vault item not found.');
	}
}
