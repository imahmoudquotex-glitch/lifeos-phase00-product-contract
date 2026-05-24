import type { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { AppError, envelopeErr, systemClock } from '@lifeos/shared';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';

type RateLimitConfig = {
  bucketPrefix: string;     // e.g. 'auth:signin'
  maxAttempts: number;      // 5
  windowSeconds: number;    // 900 (15 min)
  lockoutSeconds: number;   // 3600 (1 hour)
  keyFn: (req: NextRequest, body: unknown) => string; // returns 'ip:email'
};

/**
 * HOC that enforces IP+email composite rate limiting via rate_limit_buckets table.
 * ADR-0029: Bucket key = sha256(ip:email), 5 attempts / 15min, lockout 1h.
 *
 * Schema required (migration 0146 — now includes all needed columns):
 *   bucket_key TEXT UNIQUE, attempts INTEGER, window_start_ms BIGINT, locked_until_ms BIGINT
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

      const env = getServerEnv();
      const dbClient = getDb(env.DATABASE_URL);

      // Use a transaction so the SELECT ... FOR UPDATE and subsequent INSERT/UPDATE are atomic
      return dbClient.tx(async (tx) => {
        const bucket = await tx.oneOrNone<{
          attempts: number;
          window_start_ms: number;
          locked_until_ms: number | null;
        }>(
          `SELECT attempts, window_start_ms, locked_until_ms
           FROM rate_limit_buckets
           WHERE bucket_key = $1
           FOR UPDATE`,
          [bucketKey],
        );

        // Check lockout
        if (bucket?.locked_until_ms && bucket.locked_until_ms > now) {
          return Response.json(
            envelopeErr(new AppError('AUTH_RATE_LIMITED', 'Too many attempts. Try later.')),
            {
              status: 429,
              headers: {
                'Retry-After': String(Math.ceil((bucket.locked_until_ms - now) / 1000)),
                'X-RateLimit-Reset': String(Math.ceil(bucket.locked_until_ms / 1000)),
              },
            },
          );
        }

        // Reset window if expired
        const windowExpired =
          !bucket ||
          now - bucket.window_start_ms > cfg.windowSeconds * 1000;

        const res = await handler(req, body);

        // On failure: increment counter
        if (res.status >= 400 && res.status !== 429) {
          const currentAttempts = windowExpired ? 0 : (bucket?.attempts ?? 0);
          const nextAttempts = currentAttempts + 1;
          const lockedUntil =
            nextAttempts >= cfg.maxAttempts ? now + cfg.lockoutSeconds * 1000 : null;

          await tx.none(
            `INSERT INTO rate_limit_buckets
               (id, bucket_key, attempts, window_start_ms, locked_until_ms)
             VALUES (gen_random_uuid()::text, $1, 1, $2, $3)
             ON CONFLICT (bucket_key) DO UPDATE
               SET attempts       = CASE WHEN $4 THEN 1 ELSE rate_limit_buckets.attempts + 1 END,
                   window_start_ms = CASE WHEN $4 THEN $2 ELSE rate_limit_buckets.window_start_ms END,
                   locked_until_ms = $3,
                   updated_at      = now()`,
            [bucketKey, now, lockedUntil, windowExpired],
          );
        } else if (res.status < 400) {
          // On success: reset the bucket
          await tx.none(
            `DELETE FROM rate_limit_buckets WHERE bucket_key = $1`,
            [bucketKey],
          );
        }

        return res;
      });
    };
}
