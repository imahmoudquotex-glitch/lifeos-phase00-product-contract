import type { DbClient } from '@lifeos/db';
import { AppError } from '@lifeos/shared/errors';
import { computeEventHash, GENESIS_HASH } from '@lifeos/security';
import { verifyPassword } from './password';
import { createSession } from './session';
import { userRepo } from './user.repo';
import { newUlid } from '@lifeos/shared/ids';
import { systemClock, toIso } from '@lifeos/shared/time';

export type SignInResult = {
  sessionToken: string;   // raw token to set in cookie
  sessionId: string;      // token_hash (stable DB id)
  userId: string;
  workspaceId: string | null;
  locale: string;
};

/**
 * ADR-0026: signInWithPassword facade.
 * Phase 02 compliant:
 * - Only queries columns that exist in migration 0100__identity_users.sql
 * - Workspace resolved via workspace_memberships (not users.workspace_id)
 * - Audit event columns match 0109__workspace_audit_events.sql (actor_user_id, created_at)
 * - Uses injected DbClient throughout
 * - No global db singleton
 */
export async function signInWithPassword(
  dbClient: DbClient,
  email: string,
  password: string,
  userAgent: string,
): Promise<SignInResult> {
  // Query only columns that exist in the users table (migration 0100)
  const user = await userRepo.findUserByEmailForLogin(dbClient, email);

  if (!user || !user.password_hash) {
    throw new AppError('AUTH_INVALID_CREDENTIALS', 'Invalid credentials.');
  }

  // status field: 'active' | 'suspended' | 'deleted'
  if (user.status === 'suspended') {
    throw new AppError('AUTH_ACCOUNT_LOCKED', 'Account suspended. Contact support.');
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) throw new AppError('AUTH_INVALID_CREDENTIALS', 'Invalid credentials.');

  // Resolve workspace via workspace_memberships
  const membership = await dbClient.oneOrNone<{ workspace_id: string }>(
    `SELECT workspace_id FROM workspace_memberships
     WHERE user_id = $1
     ORDER BY joined_at ASC
     LIMIT 1`,
    [user.id],
  );

  // Create session with DI
  const session = await createSession(dbClient, user.id, userAgent);

  // Update last_login_at
  await userRepo.recordLogin(dbClient, user.id);

  // Audit event — column names match migration 0109 exactly:
  //   actor_user_id (not actor_id), created_at (not occurred_at)
  const workspaceId = membership?.workspace_id;
  if (workspaceId) {
    await dbClient.tx(async (tx) => {
      // Advisory xact lock ensures no concurrent inserts for this workspace
      // hashtext() in postgres converts string to integer lock id
      await tx.none(`SELECT pg_advisory_xact_lock(hashtext($1))`, [workspaceId]);

      const prevRow = await tx.oneOrNone<{ event_hash: string }>(
        `SELECT event_hash FROM workspace_audit_events
           WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [workspaceId],
      );
      const prevHash = prevRow?.event_hash ?? GENESIS_HASH;
      const occurredAt = toIso(systemClock.nowMs());
      const evInput = {
        workspaceId,
        actorId: user.id,
        eventType: 'auth.signin.success',
        payload: { userAgent },
        occurredAt,
      };
      const eventHash = computeEventHash(prevHash, evInput);
      await tx.none(
        `INSERT INTO workspace_audit_events
           (id, workspace_id, actor_user_id, event_type, payload, event_hash, prev_hash)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)`,
        [
          newUlid(),
          workspaceId,
          user.id,
          evInput.eventType,
          JSON.stringify(evInput.payload),
          eventHash,
          prevHash,
        ],
      );
    });
  }

  const { hashSessionToken } = await import('./session');
  return {
    sessionToken: session.token,
    sessionId: hashSessionToken(session.token),
    userId: user.id,
    workspaceId: workspaceId ?? null,
    locale: 'en', // Phase 02 users table has no locale column; added in 0200
  };
}
