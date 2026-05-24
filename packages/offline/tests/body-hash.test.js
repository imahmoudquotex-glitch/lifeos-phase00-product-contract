import { describe, expect, it } from 'vitest';
import { computeBodyHash } from '../src/body-hash';
describe('computeBodyHash', () => {
    it('returns 64-char hex string', () => {
        const h = computeBodyHash('{}');
        expect(h).toMatch(/^[0-9a-f]{64}$/);
    });
    it('is deterministic', () => {
        const body = '{"title":"test"}';
        expect(computeBodyHash(body)).toBe(computeBodyHash(body));
    });
    it('differs for different bodies', () => {
        expect(computeBodyHash('{"a":1}')).not.toBe(computeBodyHash('{"a":2}'));
    });
});
//# sourceMappingURL=body-hash.test.js.map