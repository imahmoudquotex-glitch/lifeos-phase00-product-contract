import { type NextRequest, NextResponse } from 'next/server';
import { withApiErrorHandling } from '@lifeos/route';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';
import { consumePasswordReset, hashPassword, revokeAllUserSessions, userRepo } from '@lifeos/auth';
import { envelopeOk } from '@lifeos/shared';

export const POST = withApiErrorHandling(async (req: Request) => {
  const { token, newPassword } = await req.json() as { token: string; newPassword: string };
  const env = getServerEnv();
  const dbClient = getDb(env.DATABASE_URL);
  
  const userId = await consumePasswordReset(dbClient, token);
  const hash = await hashPassword(newPassword);
  await userRepo.updatePassword(dbClient, userId, hash);
  await revokeAllUserSessions(dbClient, userId);
  return NextResponse.json(envelopeOk({ ok: true }));
});
