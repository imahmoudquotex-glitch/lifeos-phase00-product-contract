import type { DbClient } from '@lifeos/db';
import { getDb } from '@lifeos/db';
import { newUlid, AppError, systemClock } from '@lifeos/shared';
import { getServerEnv } from '@lifeos/shared/env';
import { hashPassword } from './password';
import { createSession } from './session';

export type SignUpInput = {
  email: string;
  password: string;
  displayName: string;
  locale?: string;
  userAgent: string;
};

export type SignUpResult = {
  sessionToken: string;
  userId: string;
  workspaceId: string;
  locale: string;
};

/**
 * Creates a new user + default workspace + membership + initial session in one transaction.
 * Phase 02 compliant: uses DI DbClient, queries only existing columns.
 */
export async function signUp(input: SignUpInput): Promise<SignUpResult> {
  const { email, password, displayName, locale = 'en', userAgent } = input;

  const env = getServerEnv();
  const dbClient: DbClient = getDb(env.DATABASE_URL);

  // Check email uniqueness (status <> 'deleted' — no is_deleted column)
  const existing = await dbClient.oneOrNone<{ id: string }>(
    `SELECT id FROM users WHERE email = $1 AND status <> 'deleted'`,
    [email.toLowerCase()],
  );
  if (existing) throw new AppError('CONFLICT', 'Email already in use.');

  const passwordHash = await hashPassword(password);
  const userId = newUlid();
  const workspaceId = newUlid();
  const now = new Date(systemClock.nowMs()).toISOString();

  await dbClient.tx(async (tx) => {
    // 1. Create workspace (no users.workspace_id — workspace is a separate entity)
    await tx.none(
      `INSERT INTO workspaces (id, name, slug, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $4)`,
      [workspaceId, `${displayName}'s Workspace`, workspaceId, now],
    );
    // 2. Create user (only columns from migration 0100)
    await tx.none(
      `INSERT INTO users (id, email, password_hash, display_name, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $5)`,
      [userId, email.toLowerCase(), passwordHash, displayName, now],
    );
    // 3. Create owner membership (workspace_memberships, not workspace_members)
    await tx.none(
      `INSERT INTO workspace_memberships (workspace_id, user_id, role, joined_at)
       VALUES ($1, $2, 'owner', $3)`,
      [workspaceId, userId, now],
    );
    // 4. Create profile
    await tx.none(
      `INSERT INTO profiles (user_id) VALUES ($1)`,
      [userId],
    );
  });

  const session = await createSession(dbClient, userId, userAgent);

  return { sessionToken: session.token, userId, workspaceId, locale };
}
