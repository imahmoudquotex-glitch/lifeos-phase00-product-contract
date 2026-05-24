import { type NextRequest } from 'next/server';
import { envelopeOk, envelopeErr, AppError, statusForError } from '@lifeos/shared';
import { signInWithPassword } from '@lifeos/auth';
import { withCsrfProtection, withRateLimit } from '@lifeos/web-guards';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';

/**
 * POST /api/v1/auth/signin
 * ADR-0026: Uses signInWithPassword facade
 * ADR-0027: Wrapped with withCsrfProtection HOC
 * ADR-0029: Wrapped with withRateLimit (IP+email composite, 5/15min)
 * Cookie name uses SESSION_COOKIE_NAME from env (not hardcoded).
 */
const handler = async (
  req: NextRequest,
  body: unknown,
): Promise<Response> => {
  const { email, password } = body as { email: string; password: string };

  if (!email || typeof email !== 'string') {
    return Response.json(
      envelopeErr(new AppError('VALIDATION_FAILED', 'email is required')),
      { status: 400 },
    );
  }
  if (!password || typeof password !== 'string') {
    return Response.json(
      envelopeErr(new AppError('VALIDATION_FAILED', 'password is required')),
      { status: 400 },
    );
  }

  try {
    const env = getServerEnv();
    const dbClient = getDb(env.DATABASE_URL);
    const ua = req.headers.get('user-agent') ?? '';

    const result = await signInWithPassword(dbClient, email, password, ua);

    const ttlSeconds = env.SESSION_TTL_DAYS * 24 * 3600;
    const cookieName = env.SESSION_COOKIE_NAME;

    const res = Response.json(
      envelopeOk({ redirectTo: '/app', locale: result.locale }),
      { status: 200 },
    );
    res.headers.append(
      'Set-Cookie',
      `${cookieName}=${result.sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${ttlSeconds}`,
    );
    return res;
  } catch (e) {
    if (e instanceof AppError) {
      return Response.json(envelopeErr(e), { status: statusForError(e) });
    }
    throw e;
  }
};

export const POST = withCsrfProtection(
  withRateLimit({
    bucketPrefix: 'auth:signin',
    maxAttempts: 5,
    windowSeconds: 900,
    lockoutSeconds: 3600,
    keyFn: (req, body) => {
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
      const email = ((body as { email?: string })?.email ?? '').toLowerCase();
      return `${ip}:${email}`;
    },
  })(handler),
);
