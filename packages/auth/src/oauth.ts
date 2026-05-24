import type { DbClient } from '@lifeos/db';
export async function linkOauthAccount(db: DbClient, userId: string, provider: string, providerUserId: string): Promise<void> {}

import { systemClock } from '@lifeos/shared';

export async function verifyAndConsumeStateToken(dbClient: DbClient, state: string): Promise<boolean> {
  const stored = await dbClient.oneOrNone<{
    state: string;
    expires_at: Date;
    consumed_at: Date | null;
  }>(
    `SELECT state, expires_at, consumed_at FROM oauth_state_store
       WHERE state = $1 FOR UPDATE`,
    [state],
  );

  if (!stored) {
    return false;
  }
  if (stored.consumed_at) {
    return false;
  }
  if (stored.expires_at.getTime() < systemClock.nowMs()) {
    return false;
  }

  await dbClient.none(
    `UPDATE oauth_state_store SET consumed_at = now() WHERE state = $1`,
    [state],
  );

  return true;
}

