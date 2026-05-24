import { createHmac, randomBytes } from 'node:crypto';
import { getServerEnv } from '@lifeos/shared/env';
import type { DbClient } from '@lifeos/db';
import { systemClock } from '@lifeos/shared/time';
import { AppError } from '@lifeos/shared/errors';

/**
 * Phase 02 session contract.
 * ADR-0013: token = randomBytes(32) base64url, only hash stored in DB.
 * TTL: from SESSION_TTL_DAYS env var (never hardcoded).
 * All functions accept DbClient (DI) — no global singleton.
 */

export function hashSessionToken(rawToken: string): string {
  const { SESSION_PEPPER } = getServerEnv();
  return createHmac('sha256', SESSION_PEPPER).update(rawToken).digest('hex');
}

export async function createSession(
  dbClient: DbClient,
  userId: string,
  userAgent?: string,
  ip?: string,
): Promise<{ token: string; expiresAt: string }> {
  // ADR-0013: raw token = 32 cryptographic random bytes, not a ULID
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashSessionToken(token);

  const env = getServerEnv();
  const ttlMs = env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  const expiresAtMs = systemClock.nowMs() + ttlMs;
  // Avoid new Date() in business logic per ADR-0013 — use nowMs() + manual ISO
  const expiresAtIso = new Date(expiresAtMs).toISOString();

  await dbClient.none(
    `INSERT INTO sessions (id, user_id, token_hash, user_agent, ip_inet, expires_at)
     VALUES ($1, $2, $3, $4, $5::inet, $6)`,
    [tokenHash, userId, tokenHash, userAgent ?? null, ip ?? null, expiresAtIso],
  );

  return { token, expiresAt: expiresAtIso };
}

export interface ValidatedSession {
  sessionId: string;  // token_hash (the stable DB id)
  userId: string;
  locale: string;
  workspaceId: string | null;
}

export async function validateSession(
  dbClient: DbClient,
  rawToken: string,
): Promise<ValidatedSession | null> {
  const tokenHash = hashSessionToken(rawToken);
  const now = systemClock.nowIso();

  const session = await dbClient.oneOrNone<{
    token_hash: string;
    user_id: string;
    expires_at: string;
    status: string;
    locale: string | null;
    last_seen_at: string | null;
  }>(
    `SELECT s.id AS token_hash, s.user_id, s.expires_at, s.last_seen_at,
            u.status, u.locale
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = $1 AND s.revoked_at IS NULL`,
    [tokenHash],
  );

  if (!session) return null;
  // String ISO comparison — no globalThis.Date()
  if (session.expires_at < now) return null;
  if (session.status !== 'active') return null;

  // Throttled last_seen_at: only update if > 60 s since last touch
  const sixtySecondsAgo = new Date(systemClock.nowMs() - 60_000).toISOString();
  if (!session.last_seen_at || session.last_seen_at < sixtySecondsAgo) {
    await dbClient.none(
      `UPDATE sessions SET last_seen_at = now() WHERE id = $1`,
      [tokenHash],
    );
  }

  // Resolve default workspace for this user
  const membership = await dbClient.oneOrNone<{ workspace_id: string }>(
    `SELECT workspace_id FROM workspace_memberships
     WHERE user_id = $1
     ORDER BY joined_at ASC
     LIMIT 1`,
    [session.user_id],
  );

  return {
    sessionId: session.token_hash,
    userId: session.user_id,
    locale: session.locale ?? 'en',
    workspaceId: membership?.workspace_id ?? null,
  };
}

export async function revokeSession(dbClient: DbClient, rawToken: string): Promise<void> {
  const tokenHash = hashSessionToken(rawToken);
  await dbClient.none(
    `UPDATE sessions SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL`,
    [tokenHash],
  );
}

export async function revokeAllUserSessions(
  dbClient: DbClient,
  userId: string,
): Promise<void> {
  await dbClient.none(
    `UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId],
  );
}
