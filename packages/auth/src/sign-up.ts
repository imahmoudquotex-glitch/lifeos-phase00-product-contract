import { db } from '@lifeos/db';
import { newUlid, AppError, systemClock } from '@lifeos/shared';
import { hashPassword } from './password';
import { createSession } from './session';

export type SignUpInput = {
	email: string;
	password: string;
	displayName: string;
	locale?: string;
	deviceFingerprint: string;
	userAgent: string;
};

export type SignUpResult = {
	sessionId: string;
	userId: string;
	workspaceId: string;
	locale: string;
};

/**
 * Creates a new user + default workspace + initial session in one transaction.
 * Throws AUTH_ACCOUNT_LOCKED with code 409 if email already exists.
 */
export async function signUp(input: SignUpInput): Promise<SignUpResult> {
	const { email, password, displayName, locale = 'en', deviceFingerprint, userAgent } = input;

	const existing = await db.oneOrNone<{ id: string }>(
		`SELECT id FROM users WHERE email = $1 AND is_deleted = false`,
		[email.toLowerCase()],
	);
	if (existing) throw new AppError('AUTH_INVALID_CREDENTIALS', 'Email already in use.');

	const passwordHash = await hashPassword(password);
	const userId = newUlid();
	const workspaceId = newUlid();
	const now = new Date(systemClock.nowMs()).toISOString();

	await db.tx(async (t) => {
		// Create workspace first (users.workspace_id FK)
		await t.none(
			`INSERT INTO workspaces (id, name, slug, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $4)`,
			[workspaceId, `${displayName}'s Workspace`, userId, now],
		);
		await t.none(
			`INSERT INTO users (id, workspace_id, email, password_hash, display_name, locale, created_at, updated_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $7)`,
			[userId, workspaceId, email.toLowerCase(), passwordHash, displayName, locale, now],
		);
		await t.none(
			`INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
			 VALUES ($1, $2, 'owner', $3)`,
			[workspaceId, userId, now],
		);
	});

	const session = await createSession(userId, userAgent);

	return { sessionId: session.token, userId, workspaceId, locale };
}
