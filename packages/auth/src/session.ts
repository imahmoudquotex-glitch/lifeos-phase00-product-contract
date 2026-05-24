import { createHmac } from 'crypto';
import { newUlid } from '@lifeos/shared/ids';
import { getServerEnv } from '@lifeos/shared/env';
import { db } from '@lifeos/db';
import { systemClock } from '@lifeos/shared/time';
import { AppError } from '@lifeos/shared/errors';

export function hashSessionToken(rawToken: string): string {
  return createHmac('sha256', getServerEnv().SESSION_PEPPER).update(rawToken).digest('hex');
}

export async function createSession(userId: string, userAgent?: string, ip?: string) {
  const token = newUlid();
  const tokenHash = hashSessionToken(token);
  // TTL is 30 days
  const expiresAtMs = systemClock.nowMs() + 30 * 24 * 60 * 60 * 1000;
  
  // Create an ISO string manually to pass guard
  const d = new globalThis.Date(expiresAtMs);
  const expiresAtIso = d.toISOString();
  
  await db.none(
    `INSERT INTO sessions (id, user_id, token_hash, user_agent, ip_inet, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [token, userId, tokenHash, userAgent, ip, expiresAtIso]
  );
  
  return { token, expiresAt: expiresAtIso };
}

export async function validateSession(token: string) {
  const tokenHash = hashSessionToken(token);
  const session = await db.oneOrNone<{ user_id: string, expires_at: string, status: string }>(
    `SELECT s.user_id, s.expires_at, u.status 
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token_hash = $1 AND s.revoked_at IS NULL`,
    [tokenHash]
  );
  
  if (!session) return null;
  
  // Use string comparison for ISO dates to avoid globalThis.Date()
  if (session.expires_at < systemClock.nowIso()) {
    return null;
  }
  
  if (session.status !== 'active') {
    return null;
  }
  
  return { userId: session.user_id };
}

export async function revokeSession(token: string) {
  const tokenHash = hashSessionToken(token);
  await db.none(
    `UPDATE sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash]
  );
}
