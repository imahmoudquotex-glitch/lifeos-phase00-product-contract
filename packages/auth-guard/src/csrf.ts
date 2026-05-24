import { AppError } from '@lifeos/shared';
import { timingSafeEqual, createHash } from 'crypto';

/**
 * CSRF double-submit cookie validation.
 *
 * Strategy: client sends the raw token in both:
 *   - Cookie:        __csrf=<token>
 *   - Header:        X-CSRF-Token: <token>
 *
 * Server compares SHA-256 digests of both values using timingSafeEqual
 * to prevent timing-based enumeration.
 *
 * UI wiring deferred to Phase 05 (Phase 02 stub is now fully replaced).
 */
export function validateCsrf(req: Request): void {
  const headerToken = (req as unknown as Record<string, unknown> & {
    headers?: { get?(name: string): string | null };
  }).headers?.get?.('x-csrf-token') ?? null;

  // Support Next.js / raw fetch Request — cookies are not standardised
  // across all server runtimes. We read from the Cookie header directly.
  const cookieHeader = (req as unknown as Record<string, unknown> & {
    headers?: { get?(name: string): string | null };
  }).headers?.get?.('cookie') ?? '';

  const cookieToken = parseCookieValue(cookieHeader, '__csrf');

  if (!headerToken || !cookieToken) {
    throw new AppError('CSRF_INVALID', 'CSRF token missing');
  }

  const a = Buffer.from(sha256(headerToken), 'hex');
  const b = Buffer.from(sha256(cookieToken), 'hex');

  // Lengths must match before timingSafeEqual (otherwise throws)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new AppError('CSRF_INVALID', 'CSRF token mismatch');
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function parseCookieValue(cookieHeader: string, name: string): string | null {
  const prefix = `${name}=`;
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return trimmed.slice(prefix.length);
    }
  }
  return null;
}

