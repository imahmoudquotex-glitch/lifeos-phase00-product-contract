import { describe, expect, it } from 'vitest';
import { generateOAuthState, generatePkceVerifier, pkceChallengeS256, assertOAuthState, } from '../src/oauth-state';
import { AppError } from '@lifeos/shared';
describe('generateOAuthState', () => {
    it('returns a non-empty string', () => {
        const s = generateOAuthState();
        expect(s.length).toBeGreaterThan(10);
    });
    it('returns different values', () => {
        expect(generateOAuthState()).not.toBe(generateOAuthState());
    });
});
describe('pkceChallengeS256', () => {
    it('returns base64url-encoded SHA-256', () => {
        const verifier = generatePkceVerifier();
        const challenge = pkceChallengeS256(verifier);
        expect(challenge).toMatch(/^[A-Za-z0-9_-]+=*$/);
        expect(challenge.length).toBeGreaterThan(10);
    });
    it('is deterministic', () => {
        const v = generatePkceVerifier();
        expect(pkceChallengeS256(v)).toBe(pkceChallengeS256(v));
    });
});
describe('assertOAuthState', () => {
    it('throws OAUTH_STATE_INVALID when stored is null', () => {
        expect(() => assertOAuthState(null, 'state', new Date())).toThrow(expect.objectContaining({ code: 'OAUTH_STATE_INVALID' }));
    });
    it('throws OAUTH_STATE_EXPIRED when expired', () => {
        const stored = {
            state: 'abc',
            expiresAt: new Date('2020-01-01T00:00:00Z'),
        };
        expect(() => assertOAuthState(stored, 'abc', new Date('2026-01-01T00:00:00Z'))).toThrow(expect.objectContaining({ code: 'OAUTH_STATE_EXPIRED' }));
    });
    it('throws OAUTH_STATE_INVALID on mismatch', () => {
        const stored = {
            state: 'abc',
            expiresAt: new Date('2099-01-01T00:00:00Z'),
        };
        expect(() => assertOAuthState(stored, 'xyz', new Date())).toThrow(expect.objectContaining({ code: 'OAUTH_STATE_INVALID' }));
    });
    it('does not throw when valid', () => {
        const state = generateOAuthState();
        const stored = { state, expiresAt: new Date('2099-01-01T00:00:00Z') };
        expect(() => assertOAuthState(stored, state, new Date())).not.toThrow();
    });
});
//# sourceMappingURL=oauth-state.test.js.map