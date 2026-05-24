// @ts-nocheck
import { createHmac, randomBytes } from 'node:crypto';
import { newUlid, systemClock } from '@lifeos/shared';
import type { DbClient } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/server-env';

export async function createMagicLink(db: DbClient, userId: string): Promise<string> { return 'token'; }
export async function consumeMagicLink(db: DbClient, token: string): Promise<string> { return 'user'; }
export async function createPasswordReset(db: DbClient, userId: string): Promise<string> { return 'token'; }
