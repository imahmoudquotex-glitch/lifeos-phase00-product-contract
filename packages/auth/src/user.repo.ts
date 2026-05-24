import { db } from '@lifeos/db';

export const userRepo = {
  findUserByEmailForLogin: async (email: string) => {
    return db.oneOrNone<{ id: string, password_hash: string, status: string }>(
      'SELECT id, password_hash, status FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
  },
  recordLogin: async (userId: string) => {
    await db.none('UPDATE users SET last_login_at = now() WHERE id = $1', [userId]);
  },
  findIdByEmail: async (email: string) => {
    return db.oneOrNone<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]);
  },
  updatePassword: async (userId: string, hash: string) => {
    await db.none('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
  },
  markEmailVerified: async (userId: string) => {
    await db.none('UPDATE users SET email_verified = true WHERE id = $1', [userId]);
  },
  createUser: async (id: string, email: string, hash: string, displayName: string) => {
    await db.tx(async (tx: any) => {
      await tx.none(
        'INSERT INTO users (id, email, password_hash, display_name) VALUES ($1, $2, $3, $4)',
        [id, email.toLowerCase(), hash, displayName]
      );
      await tx.none('INSERT INTO profiles (user_id) VALUES ($1)', [id]);
    });
  },
  getProfile: async (userId: string) => {
    const rows = await db.many(
      `SELECT u.id, u.email, u.display_name, p.avatar_url, p.timezone 
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );
    return rows[0];
  }
};
