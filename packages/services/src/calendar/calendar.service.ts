import { AppError } from '@lifeos/shared';
import { assertCapability, actorUserId, type Actor } from '@lifeos/permissions';
import type { DbClient } from '@lifeos/db';
import { CalendarRepo } from './calendar.repo';
import type { CalendarEvent } from './calendar.types';

export class CalendarService {
	private readonly repo: CalendarRepo;

	constructor(db: DbClient) {
		this.repo = new CalendarRepo(db);
	}

	async create(actor: Actor, input: {
		title: string;
		startsAt: Date;
		endsAt: Date;
		allDay?: boolean;
		location?: string;
		notes?: string;
		timezone?: string;
	}): Promise<CalendarEvent> {
		assertCapability(actor, 'calendar:create');
		if (input.endsAt.getTime() <= input.startsAt.getTime()) {
			throw new AppError('CALENDAR_TIME_INVALID', 'Event end time must be after start time.');
		}
		return this.repo.create({
			workspaceId: actor.workspaceId,
			createdBy: actorUserId(actor),
			...input,
		});
	}

	async getById(actor: Actor, id: string): Promise<CalendarEvent> {
		assertCapability(actor, 'calendar:update');
		const event = await this.repo.findById(id, actor.workspaceId);
		if (!event) throw new AppError('CALENDAR_EVENT_NOT_FOUND', 'Calendar event not found.');
		return event;
	}

	async delete(actor: Actor, id: string): Promise<void> {
		assertCapability(actor, 'calendar:delete');
		const ok = await this.repo.softDelete(id, actor.workspaceId);
		if (!ok) throw new AppError('CALENDAR_EVENT_NOT_FOUND', 'Calendar event not found.');
	}
}
