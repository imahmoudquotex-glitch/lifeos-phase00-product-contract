import { describe, expect, it } from 'vitest';
import { systemClock, fixedClock } from './clock';

describe('systemClock', () => {
	it('nowMs returns a number > 0', () => {
		expect(systemClock.nowMs()).toBeGreaterThan(0);
	});
	it('nowIso returns a UTC ISO string', () => {
		expect(systemClock.nowIso()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
	});
});

describe('fixedClock', () => {
	it('returns the fixed ISO string', () => {
		const c = fixedClock('2024-01-01T00:00:00.000Z');
		expect(c.nowIso()).toBe('2024-01-01T00:00:00.000Z');
	});
	it('nowMs matches the parsed timestamp', () => {
		const c = fixedClock('2024-01-01T00:00:00.000Z');
		expect(c.nowMs()).toBe(1704067200000);
	});
});
