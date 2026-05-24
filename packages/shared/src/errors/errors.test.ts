import { describe, expect, it } from 'vitest';
import { AppError } from './app-error';
import { ok, err, isOk, isErr } from './result';

describe('AppError', () => {
	it('sets code and message', () => {
		const e = new AppError('NOT_FOUND', 'item missing');
		expect(e.code).toBe('NOT_FOUND');
		expect(e.message).toBe('item missing');
		expect(e.name).toBe('AppError');
	});
	it('falls back to code as message when no message given', () => {
		const e = new AppError('AUTH_REQUIRED');
		expect(e.message).toBe('AUTH_REQUIRED');
	});
	it('stores metadata', () => {
		const e = new AppError('VALIDATION_FAILED', 'bad', { field: 'email' });
		expect(e.metadata).toEqual({ field: 'email' });
	});
	it('instanceof Error is true', () => {
		expect(new AppError('UNKNOWN') instanceof Error).toBe(true);
	});
});

describe('Result', () => {
	it('ok wraps value', () => {
		const r = ok(42);
		expect(isOk(r)).toBe(true);
		expect(isErr(r)).toBe(false);
		if (isOk(r)) expect(r.value).toBe(42);
	});
	it('err wraps AppError', () => {
		const r = err(new AppError('UNKNOWN', 'oops'));
		expect(isErr(r)).toBe(true);
		expect(isOk(r)).toBe(false);
		if (isErr(r)) expect(r.error.code).toBe('UNKNOWN');
	});
});
