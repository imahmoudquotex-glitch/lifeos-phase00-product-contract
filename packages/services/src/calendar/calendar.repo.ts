import { BaseRepo } from '@lifeos/repo';
import { newUlid } from '@lifeos/shared';
import type { CalendarEvent } from './calendar.types';

type CalendarEventRow = {
	id: string;
	workspace_id: string;
	created_by: string;
	title: string;
	starts_at: Date;
	ends_at: Date;
	all_day: boolean;
	location: string | null;
	notes: string | null;
	timezone: string;
	created_at: Date;
	updated_at: Date;
};

export class CalendarRepo extends BaseRepo<CalendarEvent, CalendarEventRow> {
	protected readonly table = 'calendar_events';
	protected readonly columns = [
		'id', 'workspace_id', 'created_by', 'title', 'starts_at', 'ends_at',
		'all_day', 'location', 'notes', 'timezone', 'created_at', 'updated_at',
	] as const;

	protected mapRow(r: CalendarEventRow): CalendarEvent {
		return {
			id: r.id,
			workspaceId: r.workspace_id,
			createdBy: r.created_by,
			title: r.title,
			startsAt: r.starts_at,
			endsAt: r.ends_at,
			allDay: r.all_day,
			location: r.location,
			notes: r.notes,
			timezone: r.timezone,
			createdAt: r.created_at,
			updatedAt: r.updated_at,
		};
	}

	async create(input: {
		workspaceId: string;
		createdBy: string;
		title: string;
		startsAt: Date;
		endsAt: Date;
		allDay?: boolean;
		location?: string;
		notes?: string;
		timezone?: string;
	}): Promise<CalendarEvent> {
		const id = newUlid();
		const row = await this.db.one<CalendarEventRow>(
			`INSERT INTO calendar_events (id, workspace_id, created_by, title, starts_at, ends_at, all_day, location, notes, timezone)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
			 RETURNING ${this.selectList()}`,
			[id, input.workspaceId, input.createdBy, input.title, input.startsAt, input.endsAt,
			input.allDay ?? false, input.location ?? null, input.notes ?? null,
			input.timezone ?? 'UTC'],
		);
		return this.mapRow(row);
	}

	async softDelete(id: string, workspaceId: string): Promise<boolean> {
		const row = await this.db.oneOrNone<{ id: string }>(
			`UPDATE calendar_events SET is_deleted = true, updated_at = now()
			 WHERE id = $1 AND workspace_id = $2 AND is_deleted = false
			 RETURNING id`,
			[id, workspaceId],
		);
		return row !== null;
	}
}
