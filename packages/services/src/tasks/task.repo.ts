import { BaseRepo } from '@lifeos/repo';
import { newUlid } from '@lifeos/shared';
import type { Task, TaskStatus } from './task.types';

type TaskRow = {
	id: string;
	workspace_id: string;
	created_by: string;
	title: string;
	description: string | null;
	status: TaskStatus;
	priority: number;
	due_at: Date | null;
	completed_at: Date | null;
	parent_id: string | null;
	created_at: Date;
	updated_at: Date;
};

export class TaskRepo extends BaseRepo<Task, TaskRow> {
	protected readonly table = 'tasks';
	protected readonly columns = [
		'id', 'workspace_id', 'created_by', 'title', 'description', 'status', 'priority',
		'due_at', 'completed_at', 'parent_id', 'created_at', 'updated_at',
	] as const;

	protected mapRow(r: TaskRow): Task {
		return {
			id: r.id,
			workspaceId: r.workspace_id,
			createdBy: r.created_by,
			title: r.title,
			description: r.description,
			status: r.status,
			priority: r.priority,
			dueAt: r.due_at,
			completedAt: r.completed_at,
			parentId: r.parent_id,
			createdAt: r.created_at,
			updatedAt: r.updated_at,
		};
	}

	async create(input: {
		workspaceId: string;
		createdBy: string;
		title: string;
		description?: string;
		priority?: number;
		dueAt?: Date | null;
		parentId?: string | null;
	}): Promise<Task> {
		const id = newUlid();
		const row = await this.db.one<TaskRow>(
			`INSERT INTO tasks (id, workspace_id, created_by, title, description, priority, due_at, parent_id)
			 VALUES ($1,$2,$3,$4,$5,COALESCE($6,2),$7,$8)
			 RETURNING ${this.selectList()}`,
			[id, input.workspaceId, input.createdBy, input.title,
			input.description ?? null, input.priority ?? null,
			input.dueAt ?? null, input.parentId ?? null],
		);
		return this.mapRow(row);
	}

	async updateStatus(id: string, workspaceId: string, status: TaskStatus): Promise<Task | null> {
		const setCompletedAt = status === 'done';
		const row = await this.db.oneOrNone<TaskRow>(
			`UPDATE tasks SET status = $3,
			  completed_at = CASE WHEN $4::boolean THEN now() ELSE NULL END,
			  updated_at = now()
			 WHERE id = $1 AND workspace_id = $2 AND is_deleted = false
			 RETURNING ${this.selectList()}`,
			[id, workspaceId, status, setCompletedAt],
		);
		return row ? this.mapRow(row) : null;
	}

	async softDelete(id: string, workspaceId: string): Promise<boolean> {
		const row = await this.db.oneOrNone<{ id: string }>(
			`UPDATE tasks SET is_deleted = true, updated_at = now()
			 WHERE id = $1 AND workspace_id = $2 AND is_deleted = false
			 RETURNING id`,
			[id, workspaceId],
		);
		return row !== null;
	}

	async update(id: string, workspaceId: string, patch: {
		title?: string;
		description?: string | null;
		priority?: number;
		dueAt?: Date | null;
		parentId?: string | null;
	}): Promise<Task | null> {
		const row = await this.db.oneOrNone<TaskRow>(
			`UPDATE tasks SET
			  title = COALESCE($3, title),
			  description = CASE WHEN $4::boolean THEN $5 ELSE description END,
			  priority = COALESCE($6, priority),
			  due_at = CASE WHEN $7::boolean THEN $8 ELSE due_at END,
			  parent_id = CASE WHEN $9::boolean THEN $10 ELSE parent_id END,
			  updated_at = now()
			 WHERE id = $1 AND workspace_id = $2 AND is_deleted = false
			 RETURNING ${this.selectList()}`,
			[
				id, workspaceId,
				patch.title ?? null,
				'description' in patch, patch.description ?? null,
				patch.priority ?? null,
				'dueAt' in patch, patch.dueAt ?? null,
				'parentId' in patch, patch.parentId ?? null,
			],
		);
		return row ? this.mapRow(row) : null;
	}
}
