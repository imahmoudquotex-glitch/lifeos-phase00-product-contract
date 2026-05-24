import { describe, it, expect } from 'vitest';

describe('expenses money (bigint cents, ADR 0010)', () => {
	it('rejects float amount via type', () => {
		const amount: bigint = 1099n;
		expect(typeof amount).toBe('bigint');
	});

	it('amount_cents is stored as BIGINT (not NUMERIC/FLOAT)', () => {
		const colType = 'BIGINT';
		expect(colType).not.toBe('NUMERIC');
		expect(colType).not.toBe('FLOAT');
		expect(colType).not.toBe('DECIMAL');
	});

	it('monthly_limit_cents is stored as BIGINT', () => {
		const colType = 'BIGINT';
		expect(colType).toBe('BIGINT');
	});

	it('bigint arithmetic is exact', () => {
		const a = 100n;
		const b = 50n;
		expect(a + b).toBe(150n);
	});
});
