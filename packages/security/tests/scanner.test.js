import { describe, expect, it } from 'vitest';
import { scanTextForSecrets } from '../src/scanner';
describe('scanTextForSecrets', () => {
    it('returns empty array for clean content', () => {
        const hits = scanTextForSecrets('test.ts', 'const hello = "world";');
        expect(hits).toEqual([]);
    });
    it('detects AWS access key pattern', () => {
        const hits = scanTextForSecrets('config.ts', 'const key = "AKIAIOSFODNN7EXAMPLE";');
        expect(hits.length).toBeGreaterThan(0);
        expect(hits[0]).toContain('AWS_ACCESS_KEY');
    });
    it('detects Stripe live key', () => {
        // Use a clearly fake key pattern — prefix + placeholder chars
        const fakeStripeKey = ['sk', 'live', 'FAKEKEYFAKEKEYFAKEKEYFAKE'].join('_');
        const hits = scanTextForSecrets('payment.ts', fakeStripeKey);
        expect(hits.length).toBeGreaterThan(0);
        expect(hits[0]).toContain('STRIPE_LIVE');
    });
    it('detects private key block', () => {
        const hits = scanTextForSecrets('key.pem', '-----BEGIN RSA PRIVATE KEY-----');
        expect(hits.length).toBeGreaterThan(0);
        expect(hits[0]).toContain('PRIVATE_KEY_BLOCK');
    });
    it('detects GitHub PAT', () => {
        const hits = scanTextForSecrets('env.ts', 'const t = "ghp_' + 'a'.repeat(36) + '";');
        expect(hits.length).toBeGreaterThan(0);
        expect(hits[0]).toContain('GH_PAT');
    });
    it('includes filename in hit', () => {
        const hits = scanTextForSecrets('src/config.ts', 'AKIAIOSFODNN7EXAMPLE');
        expect(hits[0]).toContain('src/config.ts');
    });
});
//# sourceMappingURL=scanner.test.js.map