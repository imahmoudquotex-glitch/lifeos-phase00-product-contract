// @ts-nocheck
import type { DbClient } from '@lifeos/db';
export async function createEmailVerification(db: DbClient, userId: string, email: string): Promise<string> { return 'token'; }
