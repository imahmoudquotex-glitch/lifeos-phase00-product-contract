import { db } from '@lifeos/db';
import { newUlid, AppError, systemClock } from '@lifeos/shared';
import { hashPassword } from './password';

const RESET_TOKEN_TTL_MINUTES = 60;

export type ResetPasswordRequestResult = {
	tokenId: string;  // for email sending
};

/**
 * Phase 1 of password reset: generates a one-time token and stores it.
 * Always returns success (no user enumeration via timing/response).
 * The caller (email service) sends the token to the user's email.
 */
export async function requestPasswordReset(
	email: string,
): Promise<ResetPasswordRequestResult | null> {
	const user = await db.oneOrNone<{ id: string; workspace_id: string }>(
		`SELECT id, workspace_id FROM users WHERE email = $1 AND is_deleted = false`,
		[email.toLowerCase()],
	);
	// Always return null-like to prevent user enumeration
	if (!user) return null;

	const tokenId = newUlid();
	const expiresAt = new Date(systemClock.nowMs() + RESET_TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

	await db.none(
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
	const token = await db.oneOrNone<{
		id: string;
		user_id: string;
		expires_at: Date;
		used_at: Date | null;
	}>(
		`SELECT id, user_id, expires_at, used_at FROM password_reset_tokens
		   WHERE id = $1 FOR UPDATE`,
		[tokenId],
	);

	if (!token) throw new AppError('AUTH_INVALID_CREDENTIALS', 'Invalid reset token.');
	if (token.used_at) throw new AppError('AUTH_INVALID_CREDENTIALS', 'Token already used.');
	if (new Date(token.expires_at).getTime() < systemClock.nowMs()) {
		throw new AppError('AUTH_INVALID_CREDENTIALS', 'Reset token expired.');
	}

	const passwordHash = await hashPassword(newPassword);
	await db.tx(async (t) => {
		await t.none(
			`UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
			[passwordHash, token.user_id],
		);
		await t.none(
			`UPDATE password_reset_tokens SET used_at = now() WHERE id = $1`,
			[token.id],
		);
	});
}
