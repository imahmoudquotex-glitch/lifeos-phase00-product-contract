import { BaseRepo } from '@lifeos/repo';
import { newUlid } from '@lifeos/shared';
import type { VaultItemMeta, VaultItemType } from './vault.types';

type VaultItemRow = {
	id: string;
	workspace_id: string;
	owner_user_id: string;
	item_type: VaultItemType;
	title_hash: string;
	tags: string[];
	created_at: Date;
	updated_at: Date;
};

export class VaultMetaRepo extends BaseRepo<VaultItemMeta, VaultItemRow> {
	protected readonly table = 'vault_items';
	protected readonly columns = [
		'id', 'workspace_id', 'owner_user_id', 'item_type', 'title_hash', 'tags', 'created_at', 'updated_at',
	] as const;

	protected mapRow(r: VaultItemRow): VaultItemMeta {
		return {
			id: r.id,
			workspaceId: r.workspace_id,
			ownerUserId: r.owner_user_id,
			itemType: r.item_type,
			titleHash: r.title_hash,
			tags: r.tags,
			createdAt: r.created_at,
			updatedAt: r.updated_at,
		};
	}

	async findByIdAndOwner(id: string, workspaceId: string, ownerUserId: string): Promise<VaultItemMeta | null> {
		const row = await this.db.oneOrNone<VaultItemRow>(
			`SELECT ${this.selectList()} FROM vault_items
			 WHERE id = $1 AND workspace_id = $2 AND owner_user_id = $3 AND is_deleted = false`,
			[id, workspaceId, ownerUserId],
		);
		return row ? this.mapRow(row) : null;
	}

	async create(input: {
		workspaceId: string;
		ownerUserId: string;
		itemType: VaultItemType;
		titleHash: string;
		tags?: string[];
	}): Promise<VaultItemMeta> {
		const id = newUlid();
		const row = await this.db.one<VaultItemRow>(
			`INSERT INTO vault_items (id, workspace_id, owner_user_id, item_type, title_hash, tags)
			 VALUES ($1,$2,$3,$4,$5,$6)
			 RETURNING ${this.selectList()}`,
			[id, input.workspaceId, input.ownerUserId, input.itemType, input.titleHash, input.tags ?? []],
		);
		return this.mapRow(row);
	}

	async softDeleteOwned(id: string, workspaceId: string, ownerUserId: string): Promise<boolean> {
		const row = await this.db.oneOrNone<{ id: string }>(
			`UPDATE vault_items SET is_deleted = true, updated_at = now()
			 WHERE id = $1 AND workspace_id = $2 AND owner_user_id = $3 AND is_deleted = false
			 RETURNING id`,
			[id, workspaceId, ownerUserId],
		);
		return row !== null;
	}
}
