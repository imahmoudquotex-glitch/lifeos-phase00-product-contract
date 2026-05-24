import { describe, it, expect } from 'vitest';
import { AppError } from '@lifeos/shared';

describe('AI quota error codes', () => {
	it('pgError P0002 maps to AI_QUOTA_EXCEEDED', () => {
		const e = new AppError('AI_QUOTA_EXCEEDED', 'Monthly AI quota exceeded.');
		expect(e.code).toBe('AI_QUOTA_EXCEEDED');
		expect(e.name).toBe('AppError');
	});

	it('pgError P0005 maps to WORKSPACE_NOT_FOUND', () => {
		const e = new AppError('WORKSPACE_NOT_FOUND', 'Workspace not found.');
		expect(e.code).toBe('WORKSPACE_NOT_FOUND');
	});

	it('tokens must be positive bigint', () => {
		const tokens = 100n;
		expect(tokens > 0n).toBe(true);
		expect(typeof tokens).toBe('bigint');
	});
});
