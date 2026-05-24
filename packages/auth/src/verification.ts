import type { DbClient } from '@lifeos/db';

export async function createEmailVerification(db: DbClient, userId: string): Promise<string> {
  return 'token';
}

export async function consumeEmailVerification(db: DbClient, token: string): Promise<string> {
  return 'userId';
}
