import { db } from '@lifeos/db';
import { AppError, systemClock } from '@lifeos/shared';
import { computeEventHash } from '@lifeos/security';
import { verifyPassword } from './password';
import { createSession } from './session';

export type SignInResult = {
	sessionId: string;
	userId: string;
	workspaceId: string;
	locale: string;
};

/**
 * ADR-0026: signInWithPassword facade.
 * Composes verifyPassword + createSession + audit event in one call.
 */
export async function signInWithPassword(
	email: string,
	password: string,
	userAgent: string,
): Promise<SignInResult> {
	const user = await db.oneOrNone<{
		id: string;
		workspace_id: string;
		password_hash: string;
		locale: string;
		locked_at: Date | null;
	}>(
		`SELECT id, workspace_id, password_hash, locale, locked_at
		   FROM users WHERE email = $1 AND is_deleted = false`,
		[email.toLowerCase()],
	);

	if (!user) throw new AppError('AUTH_INVALID_CREDENTIALS', 'Invalid credentials.');
	if (user.locked_at) throw new AppError('AUTH_ACCOUNT_LOCKED', 'Account locked. Contact support.');

	const ok = await verifyPassword(password, user.password_hash);
	if (!ok) throw new AppError('AUTH_INVALID_CREDENTIALS', 'Invalid credentials.');

	// createSession(userId, userAgent?) → returns { token, expiresAt }
	const session = await createSession(user.id, userAgent);

	// Audit event with hash chain (ADR-0019)
	const occurredAt = new Date(systemClock.nowMs()).toISOString();
	const prev = await db.oneOrNone<{ event_hash: string }>(
		`SELECT event_hash FROM workspace_audit_events
		   WHERE workspace_id = $1 ORDER BY occurred_at DESC LIMIT 1`,
		[user.workspace_id],
	);
	const prevHash = prev?.event_hash ?? '0'.repeat(64);
	const evInput = {
		workspaceId: user.workspace_id,
		actorId: user.id,
		eventType: 'auth.signin.success',
		payload: { userAgent },
		occurredAt,
	};
	const eventHash = computeEventHash(prevHash, evInput);
	await db.none(
		`INSERT INTO workspace_audit_events
		   (workspace_id, actor_id, event_type, payload, occurred_at, prev_hash, event_hash)
		 VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)`,
		[
			user.workspace_id,
			user.id,
			evInput.eventType,
			JSON.stringify(evInput.payload),
			occurredAt,
			prevHash,
			eventHash,
		],
	);

	return {
		sessionId: session.token,       // session.token is the raw token (not hash)
		userId: user.id,
		workspaceId: user.workspace_id,
		locale: user.locale,
	};
}
