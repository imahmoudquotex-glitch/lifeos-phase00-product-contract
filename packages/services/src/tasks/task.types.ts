export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';

export type Task = {
	id: string;
	workspaceId: string;
	createdBy: string;
	title: string;
	description: string | null;
	status: TaskStatus;
	priority: number;
	dueAt: Date | null;
	completedAt: Date | null;
	parentId: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type CreateTaskInput = {
	title: string;
	description?: string;
	priority?: number;
	dueAt?: Date | null;
	parentId?: string | null;
};
