import { BaseRepo } from '@lifeos/repo';
import { newUlid } from '@lifeos/shared';
import type { Habit, HabitCheckin } from './habit.types';

type HabitRow = {
	id: string;
	workspace_id: string;
	created_by: string;
	title: string;
	cadence: string;
	target_per_period: number;
	created_at: Date;
	updated_at: Date;
};

type HabitCheckinRow = {
	id: string;
	habit_id: string;
	workspace_id: string;
	user_id: string;
	checkin_date: string;
	note: string | null;
	created_at: Date;
};

export class HabitRepo extends BaseRepo<Habit, HabitRow> {
	protected readonly table = 'habits';
	protected readonly columns = [
		'id', 'workspace_id', 'created_by', 'title', 'cadence', 'target_per_period', 'created_at', 'updated_at',
	] as const;

	protected mapRow(r: HabitRow): Habit {
		return {
			id: r.id,
			workspaceId: r.workspace_id,
			createdBy: r.created_by,
			title: r.title,
			cadence: r.cadence as Habit['cadence'],
			targetPerPeriod: r.target_per_period,
			createdAt: r.created_at,
			updatedAt: r.updated_at,
		};
	}

	async create(input: {
		workspaceId: string;
		createdBy: string;
		title: string;
		cadence?: string;
		targetPerPeriod?: number;
	}): Promise<Habit> {
		const id = newUlid();
		const row = await this.db.one<HabitRow>(
			`INSERT INTO habits (id, workspace_id, created_by, title, cadence, target_per_period)
			 VALUES ($1,$2,$3,$4,COALESCE($5,'daily'),COALESCE($6,1))
			 RETURNING ${this.selectList()}`,
			[id, input.workspaceId, input.createdBy, input.title, input.cadence ?? null, input.targetPerPeriod ?? null],
		);
		return this.mapRow(row);
	}

	async softDelete(id: string, workspaceId: string): Promise<boolean> {
		const row = await this.db.oneOrNone<{ id: string }>(
			`UPDATE habits SET is_deleted = true, updated_at = now()
			 WHERE id = $1 AND workspace_id = $2 AND is_deleted = false
			 RETURNING id`,
			[id, workspaceId],
		);
		return row !== null;
	}

	async createCheckin(input: {
		habitId: string;
		workspaceId: string;
		userId: string;
		checkinDate: string;
		note?: string;
	}): Promise<HabitCheckin> {
		const id = newUlid();
		const row = await this.db.one<HabitCheckinRow>(
			`INSERT INTO habit_checkins (id, habit_id, workspace_id, user_id, checkin_date, note)
			 VALUES ($1,$2,$3,$4,$5::date,$6)
			 RETURNING id, habit_id, workspace_id, user_id, checkin_date::text, note, created_at`,
			[id, input.habitId, input.workspaceId, input.userId, input.checkinDate, input.note ?? null],
		);
		return {
			id: row.id,
			habitId: row.habit_id,
			workspaceId: row.workspace_id,
			userId: row.user_id,
			checkinDate: row.checkin_date,
			note: row.note,
			createdAt: row.created_at,
		};
	}
}
