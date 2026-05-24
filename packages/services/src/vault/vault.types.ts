export type VaultItemType = 'password' | 'note' | 'card' | 'identity' | 'file_ref';

export type VaultItemMeta = {
	id: string;
	workspaceId: string;
	ownerUserId: string;
	itemType: VaultItemType;
	titleHash: string;
	tags: string[];
	createdAt: Date;
	updatedAt: Date;
};
