import { describe, it, expect } from 'vitest';
import { AppError } from '@lifeos/shared';

describe('calendar time validation (CalendarService)', () => {
	it('CALENDAR_TIME_INVALID error has correct code', () => {
		const e = new AppError('CALENDAR_TIME_INVALID', 'Event end time must be after start time.');
		expect(e.code).toBe('CALENDAR_TIME_INVALID');
	});

	it('throws when end === start', () => {
		const start = new Date('2026-05-01T10:00:00Z');
		const end = new Date('2026-05-01T10:00:00Z');
		expect(end.getTime() > start.getTime()).toBe(false);
	});

	it('throws when end < start', () => {
		const start = new Date('2026-05-01T10:00:00Z');
		const end = new Date('2026-05-01T09:00:00Z');
		expect(end.getTime() > start.getTime()).toBe(false);
	});

	it('passes when end > start', () => {
		const start = new Date('2026-05-01T10:00:00Z');
		const end = new Date('2026-05-01T11:00:00Z');
		expect(end.getTime() > start.getTime()).toBe(true);
	});

	it('all_day events still require ends_at > starts_at', () => {
		const start = new Date('2026-05-01T00:00:00Z');
		const end = new Date('2026-05-02T00:00:00Z');
		expect(end.getTime() > start.getTime()).toBe(true);
	});
});
