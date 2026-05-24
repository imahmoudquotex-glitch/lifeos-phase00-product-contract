export type Actor = {
	readonly userId: string;
	readonly workspaceId: string;
	readonly role: 'owner' | 'admin' | 'member' | 'guest';
	readonly capabilities?: ReadonlyArray<string>;
};
