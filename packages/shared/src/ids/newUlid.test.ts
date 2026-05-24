import { describe, expect, it } from 'vitest';
import { newUlid } from './newUlid';

describe('newUlid', () => {
	it('returns a 26-character Crockford base32 string', () => {
		expect(newUlid()).toMatch(/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/);
	});
	it('returns different values on consecutive calls', () => {
		expect(newUlid()).not.toBe(newUlid());
	});
	it('accepts a fixed timestamp for deterministic testing', () => {
		const id1 = newUlid(1704067200000);
		const id2 = newUlid(1704067200000);
		// Same time prefix, different random component
		expect(id1.slice(0, 10)).toBe(id2.slice(0, 10));
		// 26 chars total
		expect(id1).toHaveLength(26);
	});
});
