import type { DbClient } from '@lifeos/db';
import { generateSalt, deriveMasterKey, ARGON2_PARAMS } from '@lifeos/vault-crypto';
import { randomBytes } from 'crypto';

const PEPPER = process.env.SESSION_PEPPER || 'development_pepper_123';

/**
 * Hash a password using Argon2id and a pepper.
 * Returns a PHC-formatted string.
 */
export async function hashPassword(plain: string): Promise<string> {
  const peppered = plain + PEPPER;
  const salt = generateSalt();
  const hash = await deriveMasterKey(peppered, salt);
  
  const saltB64 = Buffer.from(salt).toString('base64').replace(/=/g, '');
  const hashB64 = Buffer.from(hash).toString('base64').replace(/=/g, '');
  
  return `$argon2id$v=19$m=${ARGON2_PARAMS.m},t=${ARGON2_PARAMS.t},p=${ARGON2_PARAMS.p}$${saltB64}$${hashB64}`;
}

/**
 * Verify a plain password against a PHC-formatted Argon2id hash.
 */
export async function verifyPassword(plain: string, phcHash: string): Promise<boolean> {
  const parts = phcHash.split('$');
  if (parts.length !== 6 || parts[1] !== 'argon2id') {
    return false; // Invalid format or unsupported algorithm
  }
  
  const peppered = plain + PEPPER;
  const saltB64 = parts[4]!;
  const expectedHashB64 = parts[5]!;
  
  // Pad base64 if needed
  const pad = (s: string) => s + '='.repeat((4 - s.length % 4) % 4);
  const salt = Buffer.from(pad(saltB64), 'base64');
  const expectedHash = Buffer.from(pad(expectedHashB64), 'base64');
  
  const actualHash = await deriveMasterKey(peppered, new Uint8Array(salt));
  
  // Constant-time comparison
  if (actualHash.length !== expectedHash.length) return false;
  let result = 0;
  for (let i = 0; i < actualHash.length; i++) {
    result |= actualHash[i]! ^ expectedHash[i]!;
  }
  return result === 0;
}

export async function createPasswordReset(db: DbClient, userId: string): Promise<string> {
  // In a real app, you would insert into a password_reset_tokens table.
  // We'll generate a random token for now.
  const token = randomBytes(32).toString('hex');
  // stub implementation as there is no password_reset_tokens table requested yet
  return token;
}

export async function consumePasswordReset(db: DbClient, token: string): Promise<string> {
  // stub
  return 'userId';
}
