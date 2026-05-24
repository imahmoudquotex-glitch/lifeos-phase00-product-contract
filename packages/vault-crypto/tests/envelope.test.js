import { describe, expect, it } from 'vitest';
import { sealEnvelope, openEnvelope, VaultEnvelope } from '../src/envelope';
import { generateItemKey } from '../src/item-key';
import { AppError } from '@lifeos/shared';
const MASTER_KEY = new Uint8Array(32).fill(1);
describe('sealEnvelope / openEnvelope', () => {
    it('round-trips plaintext correctly', () => {
        const itemKey = generateItemKey();
        const plaintext = new TextEncoder().encode('Hello, Vault!');
        const env = sealEnvelope(MASTER_KEY, itemKey, plaintext);
        expect(env.ciphertextBase64).toBeTypeOf('string');
        expect(env.nonceBase64).toBeTypeOf('string');
        expect(env.wrappedItemKeyBase64).toBeTypeOf('string');
        expect(env.itemKeyNonceBase64).toBeTypeOf('string');
        const recovered = openEnvelope(MASTER_KEY, env);
        expect(new TextDecoder().decode(recovered)).toBe('Hello, Vault!');
    });
    it('round-trips with AAD', () => {
        const itemKey = generateItemKey();
        const plaintext = new TextEncoder().encode('secret data');
        const aad = new TextEncoder().encode('workspace:ws_1');
        const env = sealEnvelope(MASTER_KEY, itemKey, plaintext, aad);
        const recovered = openEnvelope(MASTER_KEY, env);
        expect(new TextDecoder().decode(recovered)).toBe('secret data');
    });
    it('fails to open with wrong master key', () => {
        const itemKey = generateItemKey();
        const plaintext = new TextEncoder().encode('secret');
        const env = sealEnvelope(MASTER_KEY, itemKey, plaintext);
        const wrongKey = new Uint8Array(32).fill(2);
        expect(() => openEnvelope(wrongKey, env)).toThrow(AppError);
    });
    it('fails to open with tampered ciphertext', () => {
        const itemKey = generateItemKey();
        const plaintext = new TextEncoder().encode('secret');
        const env = sealEnvelope(MASTER_KEY, itemKey, plaintext);
        // Tamper with ciphertext
        const tampered = {
            ...env,
            ciphertextBase64: Buffer.from('tampered!').toString('base64'),
        };
        expect(() => openEnvelope(MASTER_KEY, tampered)).toThrow(AppError);
    });
});
//# sourceMappingURL=envelope.test.js.map