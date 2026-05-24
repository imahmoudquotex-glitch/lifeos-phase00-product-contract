import { AppError } from '@lifeos/shared';

/**
 * Validates that the Idempotency-Key header is present for mutation routes.
 * Throws IDEMPOTENCY_REQUIRED if absent.
 */
export function requireIdempotencyKey(req: Request): string {
	const key = req.headers.get('Idempotency-Key');
	if (!key || key.trim() === '') {
		throw new AppError('IDEMPOTENCY_REQUIRED', 'Idempotency-Key header is required');
	}
	return key.trim();
}
