import { AppError } from '@lifeos/shared';
import { assertCapability, type Actor } from '@lifeos/permissions';
import type { DbClient } from '@lifeos/db';
import { TaskRepo } from './task.repo';
import type { Task, CreateTaskInput, TaskStatus } from './task.types';

export class TaskService {
	private readonly repo: TaskRepo;

	constructor(db: DbClient) {
		this.repo = new TaskRepo(db);
	}

	async create(actor: Actor, input: CreateTaskInput): Promise<Task> {
		assertCapability(actor, 'task:create');
		return this.repo.create({
			workspaceId: actor.workspaceId,
			createdBy: actor.userId,
			...input,
		});
	}

	async list(actor: Actor, opts?: { limit?: number; cursor?: string | null }) {
		assertCapability(actor, 'task:update'); // read access via update role
		return this.repo.listByWorkspace(actor.workspaceId, opts);
	}

	async getById(actor: Actor, id: string): Promise<Task> {
		assertCapability(actor, 'task:update');
		const task = await this.repo.findById(id, actor.workspaceId);
		if (!task) throw new AppError('TASK_NOT_FOUND', 'Task not found.');
		return task;
	}

	async updateStatus(actor: Actor, id: string, status: TaskStatus): Promise<Task> {
		assertCapability(actor, 'task:update');
		const result = await this.repo.updateStatus(id, actor.workspaceId, status);
		if (!result) throw new AppError('TASK_NOT_FOUND', 'Task not found.');
		return result;
	}

	async delete(actor: Actor, id: string): Promise<void> {
		assertCapability(actor, 'task:delete');
		const ok = await this.repo.softDelete(id, actor.workspaceId);
		if (!ok) throw new AppError('TASK_NOT_FOUND', 'Task not found.');
	}
}
