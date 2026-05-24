import { describe, expect, it } from 'vitest';
import { buildOutboxRecord, verifyOutboxIntegrity, type OutboxRecord } from '../src/outbox';
import { canonicalJson } from '../src/body-hash';
import { AppError } from '@lifeos/shared';

describe('buildOutboxRecord', () => {
	it('computes bodyHash from body', () => {
		const rec = buildOutboxRecord({
			id: 'r_1',
			method: 'POST',
			url: '/api/tasks',
			headers: { 'Content-Type': 'application/json' },
			body: '{"title":"test"}',
		});
		expect(rec.bodyHash).toMatch(/^[0-9a-f]{64}$/);
		expect(rec.attempts).toBe(0);
		expect(rec.nextAttemptAt).toBeGreaterThan(0);
	});
});

describe('verifyOutboxIntegrity', () => {
	it('passes for untampered record', () => {
		const rec = buildOutboxRecord({
			id: 'r_1',
			method: 'POST',
			url: '/api/tasks',
			headers: {},
			body: '{"title":"test"}',
		});
		expect(() => verifyOutboxIntegrity(rec)).not.toThrow();
	});

	it('throws OUTBOX_BODY_HASH_MISMATCH for tampered body', () => {
		const rec = buildOutboxRecord({
			id: 'r_1',
			method: 'POST',
			url: '/api/tasks',
			headers: {},
			body: '{"title":"test"}',
		});
		const tampered: OutboxRecord = { ...rec, body: '{"title":"evil"}' };
		expect(() => verifyOutboxIntegrity(tampered)).toThrow(
			expect.objectContaining({ code: 'OUTBOX_BODY_HASH_MISMATCH' }),
		);
	});
});

describe('canonicalJson', () => {
	it('sorts object keys', () => {
		const a = canonicalJson({ z: 3, a: 1, m: 2 });
		const b = canonicalJson({ a: 1, m: 2, z: 3 });
		expect(a).toBe(b);
	});

	it('handles null', () => {
		expect(canonicalJson(null)).toBe('null');
	});

	it('handles arrays without sorting', () => {
		expect(canonicalJson([3, 1, 2])).toBe('[3,1,2]');
	});

	it('handles nested objects', () => {
		const a = canonicalJson({ b: { z: 1, a: 2 }, a: 'x' });
		const b = canonicalJson({ a: 'x', b: { a: 2, z: 1 } });
		expect(a).toBe(b);
	});
});
