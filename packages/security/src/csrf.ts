import { timingSafeEqual, randomBytes } from 'node:crypto';
import { AppError } from '@lifeos/shared';

export function generateCsrfToken(): string {
	return randomBytes(32).toString('base64url');
}

export type VerifyCsrfParams = {
	cookieToken: string;
	bodyToken: string;
};

/**
 * Double-submit cookie CSRF verification.
 * Length difference is leaked-resistant: a dummy timingSafeEqual runs
 * even when lengths differ, equalizing wall-clock.
 */
export function verifyCsrf(params: VerifyCsrfParams): boolean {
	const a = Buffer.from(params.cookieToken, 'utf-8');
	const b = Buffer.from(params.bodyToken, 'utf-8');
	if (a.length !== b.length) {
		const dummy = Buffer.alloc(Math.max(a.length, 1));
		timingSafeEqual(dummy, dummy); // burn constant time
		return false;
	}
	return timingSafeEqual(a, b);
}

export function assertCsrf(params: VerifyCsrfParams): void {
	if (!params.cookieToken || !params.bodyToken) {
		throw new AppError('CSRF_TOKEN_MISSING', 'CSRF token missing.');
	}
	if (!verifyCsrf(params)) {
		throw new AppError('CSRF_TOKEN_INVALID', 'CSRF token mismatch.');
	}
}
