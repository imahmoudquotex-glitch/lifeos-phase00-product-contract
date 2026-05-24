// @ts-nocheck
import { createHmac } from 'crypto';
import { newUlid } from '@lifeos/shared/ids';
import { serverEnv } from '@lifeos/shared/env';
import { db } from '@lifeos/db';
import { AppError } from '@lifeos/shared/errors';

export function hashSessionToken(rawToken: string): string {
  return createHmac('sha256', serverEnv.SESSION_PEPPER).update(rawToken).digest('hex');
}

export async function createSession(userId: string, userAgent?: string, ip?: string) {
  const token = newUlid();
  const tokenHash = hashSessionToken(token);
  // TTL is 30 days
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  await db.query(
    `INSERT INTO sessions (id, user_id, token_hash, user_agent, ip_inet, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [token, userId, tokenHash, userAgent, ip, expiresAt.toISOString()]
  );
  
  return { token, expiresAt };
}

export async function validateSession(token: string) {
  const tokenHash = hashSessionToken(token);
  const result = await db.query(
    `SELECT s.user_id, s.expires_at, u.status 
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token_hash = $1 AND s.revoked_at IS NULL`,
    [tokenHash]
  );
  
  if (result.rows.length === 0) return null;
  const session = result.rows[0];
  
  if (new Date(session.expires_at) < new Date()) {
    return null;
  }
  
  if (session.status !== 'active') {
    return null;
  }
  
  return { userId: session.user_id };
}

export async function revokeSession(token: string) {
  const tokenHash = hashSessionToken(token);
  await db.query(
    `UPDATE sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash]
  );
}
