import type { DbClient } from '@lifeos/db';

export async function hashPassword(plain: string): Promise<string> {
  // stub
  return plain + '_hash';
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  // stub
  return hash === plain + '_hash';
}

export async function createPasswordReset(db: DbClient, userId: string): Promise<string> {
  return 'token';
}

export async function consumePasswordReset(db: DbClient, token: string): Promise<string> {
  return 'userId';
}
