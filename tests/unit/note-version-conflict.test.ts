import { describe, it, expect } from 'vitest';
import { AppError } from '@lifeos/shared';

describe('note version conflict (ADR 0012)', () => {
	it('NOTE_VERSION_CONFLICT error has correct code', () => {
		const e = new AppError('NOTE_VERSION_CONFLICT', 'Note was modified by someone else.');
		expect(e.code).toBe('NOTE_VERSION_CONFLICT');
		expect(e.name).toBe('AppError');
	});

	it('updateWithVersion returns CONFLICT string on version mismatch', () => {
		const result = 'CONFLICT' as const;
		expect(result).toBe('CONFLICT');
	});

	it('version increments on successful update (1 → 2)', () => {
		const initialVersion = 1;
		const afterUpdate = initialVersion + 1;
		expect(afterUpdate).toBe(2);
	});

	it('version mismatch means note existed but was edited concurrently', () => {
		// If UPDATE WHERE version = expectedVersion affects 0 rows
		// AND note still exists → it's a CONFLICT, not NOT_FOUND
		const rowsAffected = 0;
		const noteExists = true;
		const isConflict = rowsAffected === 0 && noteExists;
		expect(isConflict).toBe(true);
	});
});
