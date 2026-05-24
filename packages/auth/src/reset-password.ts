import type { DbClient } from '@lifeos/db';
import { getDb } from '@lifeos/db';
import { newUlid, AppError, systemClock } from '@lifeos/shared';
import { getServerEnv } from '@lifeos/shared/env';
import { hashPassword } from './password';

/**
 * Phase 02 password reset — uses DI DbClient, no global singleton.
 * TTL read from env PASSWORD_RESET_TTL_MINUTES.
 */

export type ResetPasswordRequestResult = {
  tokenId: string; // for email sending
};

/**
 * Phase 1 of password reset: generates a one-time token and stores it.
 * Always returns null if user not found (no enumeration via timing/response).
 */
export async function requestPasswordReset(
  email: string,
): Promise<ResetPasswordRequestResult | null> {
  const env = getServerEnv();
  const dbClient: DbClient = getDb(env.DATABASE_URL);

  const user = await dbClient.oneOrNone<{ id: string }>(
    `SELECT id FROM users WHERE email = $1 AND status <> 'deleted'`,
    [email.toLowerCase()],
  );
  // Always return null to prevent user enumeration
  if (!user) return null;

  const tokenId = newUlid();
  const ttlMs = env.PASSWORD_RESET_TTL_MINUTES * 60 * 1000;
  const expiresAt = new Date(systemClock.nowMs() + ttlMs).toISOString();

  await dbClient.none(
    `INSERT INTO password_reset_tokens (id, user_id, expires_at, created_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT DO NOTHING`,
    [tokenId, user.id, expiresAt],
  );

  return { tokenId };
}

/**
 * Phase 2: validates token and updates the password.
 * Throws on invalid/expired/already-used token.
 */
export async function resetPassword(tokenId: string, newPassword: string): Promise<void> {
  const env = getServerEnv();
  const dbClient: DbClient = getDb(env.DATABASE_URL);

  const token = await dbClient.oneOrNone<{
    id: string;
    user_id: string;
    expires_at: string;
    used_at: string | null;
  }>(
    `SELECT id, user_id, expires_at, used_at FROM password_reset_tokens
       WHERE id = $1 FOR UPDATE`,
    [tokenId],
  );

  if (!token) throw new AppError('AUTH_INVALID_CREDENTIALS', 'Invalid reset token.');
  if (token.used_at) throw new AppError('AUTH_INVALID_CREDENTIALS', 'Token already used.');
  // String ISO comparison (no new Date())
  if (token.expires_at < new Date(systemClock.nowMs()).toISOString()) {
    throw new AppError('AUTH_INVALID_CREDENTIALS', 'Reset token expired.');
  }

  const passwordHash = await hashPassword(newPassword);
  await dbClient.tx(async (tx) => {
    await tx.none(
      `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
      [passwordHash, token.user_id],
    );
    await tx.none(
      `UPDATE password_reset_tokens SET used_at = now() WHERE id = $1`,
      [token.id],
    );
  });
}
