import { describe, expect, it } from 'vitest';
import { computeEventHash, verifyChain, assertChain, canonicalize, GENESIS_HASH, } from '../src/audit-chain';
import { AppError } from '@lifeos/shared';
const BASE_EVENT = {
    workspaceId: 'ws_1',
    actorId: 'u_1',
    eventType: 'task:created',
    payload: { taskId: 't_1' },
    occurredAt: '2026-05-24T12:00:00.000Z',
};
describe('canonicalize', () => {
    it('sorts keys deterministically', () => {
        const a = canonicalize({ b: 2, a: 1 });
        const b = canonicalize({ a: 1, b: 2 });
        expect(a).toBe(b);
    });
});
describe('computeEventHash', () => {
    it('returns 64-char hex string', () => {
        const h = computeEventHash(GENESIS_HASH, BASE_EVENT);
        expect(h).toMatch(/^[0-9a-f]{64}$/);
    });
    it('is deterministic', () => {
        const a = computeEventHash(GENESIS_HASH, BASE_EVENT);
        const b = computeEventHash(GENESIS_HASH, BASE_EVENT);
        expect(a).toBe(b);
    });
    it('changes when payload changes', () => {
        const a = computeEventHash(GENESIS_HASH, BASE_EVENT);
        const b = computeEventHash(GENESIS_HASH, { ...BASE_EVENT, eventType: 'task:deleted' });
        expect(a).not.toBe(b);
    });
});
describe('verifyChain', () => {
    it('returns true for empty chain', () => {
        expect(verifyChain([])).toBe(true);
    });
    it('returns true for valid single-event chain', () => {
        const h = computeEventHash(GENESIS_HASH, BASE_EVENT);
        const ev = {
            ...BASE_EVENT,
            id: 'e_1',
            prevHash: GENESIS_HASH,
            eventHash: h,
        };
        expect(verifyChain([ev])).toBe(true);
    });
    it('returns false for tampered payload (DB hash does not match recomputed)', () => {
        const h = computeEventHash(GENESIS_HASH, BASE_EVENT);
        const tampered = {
            ...BASE_EVENT,
            id: 'e_1',
            prevHash: GENESIS_HASH,
            eventHash: h,
            eventType: 'task:deleted', // tampered — but eventHash still holds original
        };
        expect(verifyChain([tampered])).toBe(false);
    });
    it('returns false when prevHash is wrong', () => {
        const h = computeEventHash(GENESIS_HASH, BASE_EVENT);
        const ev = {
            ...BASE_EVENT,
            id: 'e_1',
            prevHash: 'a'.repeat(64), // wrong
            eventHash: h,
        };
        expect(verifyChain([ev])).toBe(false);
    });
    it('returns true for valid 2-event chain', () => {
        const h1 = computeEventHash(GENESIS_HASH, BASE_EVENT);
        const ev1 = { ...BASE_EVENT, id: 'e_1', prevHash: GENESIS_HASH, eventHash: h1 };
        const ev2Input = { ...BASE_EVENT, eventType: 'task:updated' };
        const h2 = computeEventHash(h1, ev2Input);
        const ev2 = { ...ev2Input, id: 'e_2', prevHash: h1, eventHash: h2 };
        expect(verifyChain([ev1, ev2])).toBe(true);
    });
});
describe('assertChain', () => {
    it('throws AUDIT_CHAIN_BROKEN for broken chain', () => {
        const ev = {
            ...BASE_EVENT,
            id: 'e_1',
            prevHash: 'a'.repeat(64),
            eventHash: 'b'.repeat(64),
        };
        expect(() => assertChain([ev])).toThrow(expect.objectContaining({ code: 'AUDIT_CHAIN_BROKEN' }));
    });
});
//# sourceMappingURL=audit-chain.test.js.map