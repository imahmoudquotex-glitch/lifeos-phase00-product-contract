import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/password';

describe('Password Hashing', () => {
  it('should hash a password into PHC format', async () => {
    const hash = await hashPassword('my-secret-password');
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=\d+,t=\d+,p=\d+\$[a-zA-Z0-9+/]+\$[a-zA-Z0-9+/]+$/);
  });

  it('should verify a correct password', async () => {
    const plain = 'my-secret-password';
    const hash = await hashPassword(plain);
    const isValid = await verifyPassword(plain, hash);
    expect(isValid).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const plain = 'my-secret-password';
    const hash = await hashPassword(plain);
    const isValid = await verifyPassword('wrong-password', hash);
    expect(isValid).toBe(false);
  });

  it('should reject an invalid hash format', async () => {
    const isValid = await verifyPassword('password', 'invalid-hash');
    expect(isValid).toBe(false);
  });
});
