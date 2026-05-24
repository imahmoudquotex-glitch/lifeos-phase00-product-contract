export type Note = {
	id: string;
	workspaceId: string;
	createdBy: string;
	title: string;
	bodyMd: string;
	version: number;
	createdAt: Date;
	updatedAt: Date;
};

export type NoteVersion = {
	id: string;
	noteId: string;
	workspaceId: string;
	version: number;
	title: string;
	bodyMd: string;
	editedBy: string;
	createdAt: Date;
};
