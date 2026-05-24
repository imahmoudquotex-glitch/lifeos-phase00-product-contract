import { AppError } from '@lifeos/shared';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';
import { validateSession } from '@lifeos/auth';

/**
 * Phase 02 requireUser — extracts userId from session cookie.
 * Reads SESSION_COOKIE_NAME from env (not hardcoded).
 * validateSession now accepts DbClient (DI).
 */
export async function requireUser(req: Request): Promise<string> {
  const env = getServerEnv();
  const cookieName = env.SESSION_COOKIE_NAME; // e.g. 'lifeos_sid'

  // Read cookie from Cookie header (works in Edge + Node runtimes)
  const cookieHeader = req.headers.get('cookie') ?? '';
  const sid = parseCookieValue(cookieHeader, cookieName)
    // Fallback: Bearer token for API clients (not browser)
    ?? req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null;

  if (!sid) throw new AppError('AUTH_REQUIRED', 'Sign in required.');

  const dbClient = getDb(env.DATABASE_URL);
  const session = await validateSession(dbClient, sid);
  if (!session) throw new AppError('AUTH_REQUIRED', 'Session expired or invalid.');

  return session.userId;
}

function parseCookieValue(cookieHeader: string, name: string): string | null {
  const prefix = `${name}=`;
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}
