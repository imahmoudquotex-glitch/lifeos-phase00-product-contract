import { describe, expect, it } from 'vitest';
import { generateCsrfToken, verifyCsrf, assertCsrf } from '../src/csrf';
import { AppError } from '@lifeos/shared';

describe('generateCsrfToken', () => {
	it('returns a non-empty base64url string', () => {
		const token = generateCsrfToken();
		expect(token).toBeTypeOf('string');
		expect(token.length).toBeGreaterThan(20);
	});

	it('returns different tokens each call', () => {
		expect(generateCsrfToken()).not.toBe(generateCsrfToken());
	});
});

describe('verifyCsrf', () => {
	it('returns true for matching tokens', () => {
		const t = generateCsrfToken();
		expect(verifyCsrf({ cookieToken: t, bodyToken: t })).toBe(true);
	});

	it('returns false for different tokens', () => {
		expect(verifyCsrf({ cookieToken: 'aaa', bodyToken: 'bbb' })).toBe(false);
	});

	it('returns false when lengths differ (timing-safe)', () => {
		expect(verifyCsrf({ cookieToken: 'short', bodyToken: 'muchlongertoken' })).toBe(false);
	});
});

describe('assertCsrf', () => {
	it('throws CSRF_TOKEN_MISSING when tokens are empty', () => {
		expect(() => assertCsrf({ cookieToken: '', bodyToken: 'x' })).toThrow(
			expect.objectContaining({ code: 'CSRF_TOKEN_MISSING' }),
		);
	});

	it('throws CSRF_TOKEN_INVALID for mismatch', () => {
		expect(() => assertCsrf({ cookieToken: 'aaa', bodyToken: 'bbb' })).toThrow(
			expect.objectContaining({ code: 'CSRF_TOKEN_INVALID' }),
		);
	});

	it('does not throw for valid matching token', () => {
		const t = generateCsrfToken();
		expect(() => assertCsrf({ cookieToken: t, bodyToken: t })).not.toThrow();
	});
});
