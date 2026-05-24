import { type NextRequest, NextResponse } from 'next/server';
import { withApiErrorHandling } from '@lifeos/route';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';
import { consumeMagicLink, createSession } from '@lifeos/auth';
import { envelopeOk } from '@lifeos/shared';

export const POST = withApiErrorHandling(async (req: Request) => {
  const { token } = await req.json() as { token: string };
  const env = getServerEnv();
  const dbClient = getDb(env.DATABASE_URL);
  
  const userId = await consumeMagicLink(dbClient, token);
  
  const userAgent = req.headers.get('user-agent') ?? undefined;
  const ip = req.headers.get('x-forwarded-for') ?? undefined;
  const session = await createSession(dbClient, userId, userAgent, ip);
  
  return NextResponse.json(envelopeOk({ userId }), {
    headers: { 'Set-Cookie': `${env.SESSION_COOKIE_NAME}=${session.token}; HttpOnly; Path=/; SameSite=Lax` }
  });
});
