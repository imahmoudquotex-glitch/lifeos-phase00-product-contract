import type { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { AppError, envelopeErr, systemClock } from '@lifeos/shared';
import { db } from '@lifeos/db';

type RateLimitConfig = {
	bucketPrefix: string;        // e.g. 'auth:signin'
	maxAttempts: number;         // 5
	windowSeconds: number;       // 900 (15 min)
	lockoutSeconds: number;      // 3600 (1 hour)
	keyFn: (req: NextRequest, body: unknown) => string;  // returns 'ip:email'
};

/**
 * HOC that enforces IP+email composite rate limiting via rate_limit_buckets table.
 * ADR-0029: Bucket key = sha256(ip:email), 5 attempts / 15min, lockout 1h.
 *
 * Usage:
 *   export const POST = withCsrfProtection(
 *     withRateLimit({ bucketPrefix: 'auth:signin', maxAttempts: 5, ... })(handler)
 *   );
 */
export function withRateLimit(cfg: RateLimitConfig) {
	return (handler: (req: NextRequest, body: unknown) => Promise<Response>) =>
		async (req: NextRequest): Promise<Response> => {
			const body = await req.clone().json().catch(() => ({})) as unknown;
			const rawKey = cfg.keyFn(req, body);
			const bucketKey = `${cfg.bucketPrefix}:${createHash('sha256').update(rawKey).digest('hex')}`;
			const now = systemClock.nowMs();

			const bucket = await db.oneOrNone<{ attempts: number; locked_until_ms: number | null }>(
				`SELECT attempts, locked_until_ms FROM rate_limit_buckets
				   WHERE bucket_key = $1 FOR UPDATE`,
				[bucketKey],
			);

			if (bucket?.locked_until_ms && bucket.locked_until_ms > now) {
				return Response.json(
					envelopeErr(new AppError('AUTH_ACCOUNT_LOCKED', 'Too many attempts. Try later.')),
					{
						status: 423,
						headers: { 'Retry-After': String(Math.ceil((bucket.locked_until_ms - now) / 1000)) },
					},
				);
			}

			const res = await handler(req, body);

			if (res.status >= 400 && res.status !== 423) {
				const nextAttempts = (bucket?.attempts ?? 0) + 1;
				const lockedUntil = nextAttempts >= cfg.maxAttempts
					? now + cfg.lockoutSeconds * 1000
					: null;
				await db.none(
					`INSERT INTO rate_limit_buckets (bucket_key, attempts, window_start_ms, locked_until_ms)
					   VALUES ($1, 1, $2, $3)
					 ON CONFLICT (bucket_key) DO UPDATE
					   SET attempts = rate_limit_buckets.attempts + 1,
					       locked_until_ms = $3`,
					[bucketKey, now, lockedUntil],
				);
			} else if (res.status < 400) {
				await db.none(`DELETE FROM rate_limit_buckets WHERE bucket_key = $1`, [bucketKey]);
			}

			return res;
		};
}
