import { NextRequest, NextResponse } from 'next/server';
import { withApiErrorHandling } from '@lifeos/route';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';
import { consumeEmailVerification, userRepo } from '@lifeos/auth';
import { envelopeOk } from '@lifeos/shared';

export const POST = withApiErrorHandling(async (req: Request) => {
  const { token } = await req.json() as { token: string };
  const env = getServerEnv();
  const dbClient = getDb(env.DATABASE_URL);
  
  const userId = await consumeEmailVerification(dbClient, token);
  await userRepo.markEmailVerified(dbClient, userId);
  return NextResponse.json(envelopeOk({ ok: true }));
});
