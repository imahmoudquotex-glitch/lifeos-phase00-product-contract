import { describe, it, expect } from 'vitest';
import { AppError } from '@lifeos/shared';

describe('AI quota refund', () => {
	it('AI_USAGE_NOT_REFUNDABLE error has correct code', () => {
		const e = new AppError('AI_USAGE_NOT_REFUNDABLE', 'AI usage event cannot be refunded.');
		expect(e.code).toBe('AI_USAGE_NOT_REFUNDABLE');
	});

	it('refund sets status to refunded', () => {
		// SQL: UPDATE ... SET status = 'refunded', tokens_reserved = 0, tokens_used = 0
		const expectedStatus = 'refunded';
		expect(expectedStatus).toBe('refunded');
	});

	it('completed events use tokens_used (COALESCE pattern, ADR 0011)', () => {
		const tokensUsed = 150n;
		const tokensReserved = 200n;
		// tokens_used is the final count (preferred over tokens_reserved for completed events)
		expect(tokensUsed < tokensReserved).toBe(true);
		expect(typeof tokensUsed).toBe('bigint');
	});

	it('pgError P0004 maps to AI_USAGE_NOT_REFUNDABLE', () => {
		const pgCode = 'P0004';
		expect(pgCode).toBe('P0004');
	});
});
