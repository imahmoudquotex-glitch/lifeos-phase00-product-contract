import { AppError } from '@lifeos/shared';
import { assertCapability, actorUserId, type Actor } from '@lifeos/permissions';
import type { DbClient } from '@lifeos/db';
import { HabitRepo } from './habit.repo';
import type { Habit, HabitCheckin } from './habit.types';

export class HabitService {
	private readonly repo: HabitRepo;

	constructor(db: DbClient) {
		this.repo = new HabitRepo(db);
	}

	async create(actor: Actor, input: { title: string; cadence?: string; targetPerPeriod?: number }): Promise<Habit> {
		assertCapability(actor, 'habit:create');
		return this.repo.create({
			workspaceId: actor.workspaceId,
			createdBy: actorUserId(actor),
			...input,
		});
	}

	async delete(actor: Actor, id: string): Promise<void> {
		assertCapability(actor, 'habit:delete');
		const ok = await this.repo.softDelete(id, actor.workspaceId);
		if (!ok) throw new AppError('HABIT_NOT_FOUND', 'Habit not found.');
	}

	async checkin(actor: Actor, habitId: string, checkinDate: string, note?: string): Promise<HabitCheckin> {
		assertCapability(actor, 'habit:checkin');
		try {
			return await this.repo.createCheckin({
				habitId,
				workspaceId: actor.workspaceId,
				userId: actorUserId(actor),
				checkinDate,
				...(note ? { note } : {}),
			});
		} catch (e: unknown) {
			if (this.isUniqueViolation(e, 'uq_habit_checkin_day')) {
				throw new AppError('HABIT_CHECKIN_DUPLICATE', 'Already checked in for this date.');
			}
			throw e;
		}
	}

	private isUniqueViolation(e: unknown, constraint: string): boolean {
		return (
			typeof e === 'object' && e !== null &&
			'code' in e && (e as { code: string }).code === '23505' &&
			'constraint' in e && (e as { constraint: string }).constraint === constraint
		);
	}
}
