import { describe, expect, it } from 'vitest';
import { envelopeOk, envelopeErr, statusForError } from './envelope';
import { AppError } from '../errors/app-error';

describe('envelopeOk', () => {
	it('returns ok:true with data', () => {
		const r = envelopeOk({ id: '1' });
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.data).toEqual({ id: '1' });
	});
	it('includes meta when provided', () => {
		const r = envelopeOk([1, 2], { total: 2 });
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.meta).toEqual({ total: 2 });
	});
	it('omits meta when not provided', () => {
		const r = envelopeOk('hello');
		expect(r.ok).toBe(true);
		if (r.ok) expect(r.meta).toBeUndefined();
	});
});

describe('envelopeErr', () => {
	it('maps AppError to failure envelope', () => {
		const r = envelopeErr(new AppError('NOT_FOUND', 'missing'));
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.error.code).toBe('NOT_FOUND');
			expect(r.error.message).toBe('missing');
		}
	});
	it('includes metadata when present', () => {
		const r = envelopeErr(new AppError('VALIDATION_FAILED', 'bad', { field: 'email' }));
		if (!r.ok) expect(r.error.metadata).toEqual({ field: 'email' });
	});
	it('uses fallbackCode for plain Error', () => {
		const r = envelopeErr(new Error('boom'));
		if (!r.ok) expect(r.error.code).toBe('UNKNOWN');
	});
});

describe('statusForError', () => {
	it('maps NOT_FOUND to 404', () => {
		expect(statusForError(new AppError('NOT_FOUND'))).toBe(404);
	});
	it('maps AUTH_REQUIRED to 401', () => {
		expect(statusForError(new AppError('AUTH_REQUIRED'))).toBe(401);
	});
	it('maps VALIDATION_FAILED to 422', () => {
		expect(statusForError(new AppError('VALIDATION_FAILED'))).toBe(422);
	});
	it('maps plain Error to 500', () => {
		expect(statusForError(new Error('boom'))).toBe(500);
	});
	it('maps unknown AppError code to 500', () => {
		expect(statusForError(new AppError('CUSTOM_DOMAIN_ERROR'))).toBe(500);
	});
});
