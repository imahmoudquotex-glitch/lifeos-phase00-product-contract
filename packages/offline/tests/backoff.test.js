import { describe, expect, it } from 'vitest';
import { backoffMs } from '../src/backoff';
describe('backoffMs', () => {
    it('returns base + jitter for attempt 0 (base=1000)', () => {
        const ms = backoffMs(0, () => 0);
        expect(ms).toBe(1000); // 2^0 * 1000 + 0
    });
    it('returns base + jitter for attempt 3 (base=8000)', () => {
        const ms = backoffMs(3, () => 0);
        expect(ms).toBe(8000); // 2^3 * 1000 + 0
    });
    it('caps at 60000', () => {
        const ms = backoffMs(20, () => 0);
        expect(ms).toBe(60000);
    });
    it('adds jitter from random (injectable RNG)', () => {
        const ms = backoffMs(0, () => 0.5);
        expect(ms).toBe(1000 + Math.floor(0.5 * 500));
    });
    it('uses Math.random by default (non-deterministic)', () => {
        const ms = backoffMs(0);
        expect(ms).toBeGreaterThanOrEqual(1000);
        expect(ms).toBeLessThanOrEqual(1500);
    });
});
//# sourceMappingURL=backoff.test.js.map