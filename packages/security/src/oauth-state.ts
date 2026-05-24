import { randomBytes, createHash } from 'node:crypto';
import { AppError } from '@lifeos/shared';

export function generateOAuthState(): string {
	return randomBytes(32).toString('base64url');
}

export function generatePkceVerifier(): string {
	return randomBytes(32).toString('base64url');
}

export function pkceChallengeS256(verifier: string): string {
	return createHash('sha256').update(verifier).digest('base64url');
}

export function assertOAuthState(
	stored: { state: string; expiresAt: Date } | null,
	incomingState: string,
	now: Date,
): void {
	if (!stored) throw new AppError('OAUTH_STATE_INVALID', 'Unknown state.');
	if (stored.expiresAt < now) throw new AppError('OAUTH_STATE_EXPIRED', 'State expired.');
	if (stored.state !== incomingState) throw new AppError('OAUTH_STATE_INVALID', 'State mismatch.');
}
