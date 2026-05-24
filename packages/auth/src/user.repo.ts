import type { DbClient } from '@lifeos/db';
import { newUlid } from '@lifeos/shared/ids';

/**
 * User repository — Phase 02 contract.
 * All methods accept DbClient (DI). No global singleton.
 * Only queries columns that actually exist in migration 0100__identity_users.sql.
 */
export const userRepo = {
  /**
   * Find user by email for login.
   * Returns only columns that exist: id, password_hash, status.
   * Note: workspace resolution is done via workspace_memberships, NOT users.workspace_id.
   */
  findUserByEmailForLogin: async (
    dbClient: DbClient,
    email: string,
  ): Promise<{ id: string; password_hash: string | null; status: string } | null> => {
    return dbClient.oneOrNone<{ id: string; password_hash: string | null; status: string }>(
      `SELECT id, password_hash, status
       FROM users
       WHERE email = $1 AND status <> 'deleted'`,
      [email.toLowerCase()],
    );
  },

  recordLogin: async (dbClient: DbClient, userId: string): Promise<void> => {
    await dbClient.none(
      `UPDATE users SET last_login_at = now(), updated_at = now() WHERE id = $1`,
      [userId],
    );
  },

  findIdByEmail: async (
    dbClient: DbClient,
    email: string,
  ): Promise<{ id: string } | null> => {
    return dbClient.oneOrNone<{ id: string }>(
      `SELECT id FROM users WHERE email = $1`,
      [email.toLowerCase()],
    );
  },

  updatePassword: async (
    dbClient: DbClient,
    userId: string,
    hash: string,
  ): Promise<void> => {
    await dbClient.none(
      `UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
      [hash, userId],
    );
  },

  markEmailVerified: async (dbClient: DbClient, userId: string): Promise<void> => {
    await dbClient.none(
      `UPDATE users SET email_verified = true, updated_at = now() WHERE id = $1`,
      [userId],
    );
  },

  /**
   * Create user + profile in one transaction.
   * workspace is created separately by workspace service, not here.
   */
  createUser: async (
    dbClient: DbClient,
    email: string,
    hash: string,
    displayName: string,
  ): Promise<{ id: string }> => {
    const id = newUlid();
    await dbClient.tx(async (tx) => {
      await tx.none(
        `INSERT INTO users (id, email, password_hash, display_name)
         VALUES ($1, $2, $3, $4)`,
        [id, email.toLowerCase(), hash, displayName],
      );
      await tx.none(
        `INSERT INTO profiles (user_id) VALUES ($1)`,
        [id],
      );
    });
    return { id };
  },

  getProfile: async (
    dbClient: DbClient,
    userId: string,
  ): Promise<{ id: string; email: string; display_name: string; avatar_url: string | null; timezone: string | null } | null> => {
    return dbClient.oneOrNone(
      `SELECT u.id, u.email, u.display_name, p.avatar_url, p.timezone
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId],
    );
  },
};
