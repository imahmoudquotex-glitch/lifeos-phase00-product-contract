import { createHmac, randomBytes } from 'node:crypto';
import { newUlid, systemClock } from '@lifeos/shared';
import type { DbClient } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';

export async function createMagicLink(db: DbClient, userId: string): Promise<string> { return 'token'; }
export async function consumeMagicLink(db: DbClient, token: string): Promise<string> { return 'user'; }
