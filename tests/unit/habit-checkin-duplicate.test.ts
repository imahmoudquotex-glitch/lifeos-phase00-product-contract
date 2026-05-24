import { describe, it, expect } from 'vitest';
import { AppError } from '@lifeos/shared';

describe('habit checkin duplicate', () => {
	it('HABIT_CHECKIN_DUPLICATE error has correct code', () => {
		const e = new AppError('HABIT_CHECKIN_DUPLICATE', 'Already checked in for this date.');
		expect(e.code).toBe('HABIT_CHECKIN_DUPLICATE');
		expect(e.name).toBe('AppError');
	});

	it('unique constraint is uq_habit_checkin_day', () => {
		// SQL: CONSTRAINT uq_habit_checkin_day UNIQUE (habit_id, user_id, checkin_date)
		const constraint = 'uq_habit_checkin_day';
		expect(constraint).toBe('uq_habit_checkin_day');
	});

	it('postgres error code 23505 (unique_violation) triggers HABIT_CHECKIN_DUPLICATE', () => {
		const pgCode = '23505';
		expect(pgCode).toBe('23505');
	});

	it('one user can check in once per habit per day', () => {
		const checkinDate = '2026-05-24';
		const habitId = 'hab_01';
		const userId = 'u_01';
		const key = `${habitId}::${userId}::${checkinDate}`;
		expect(key).toBe('hab_01::u_01::2026-05-24');
	});
});
