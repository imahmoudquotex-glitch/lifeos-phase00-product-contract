import { type NextRequest, NextResponse } from 'next/server';
import { withApiErrorHandling } from '@lifeos/route';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';
import { createMagicLink, userRepo } from '@lifeos/auth';
import { envelopeOk } from '@lifeos/shared';

export const POST = withApiErrorHandling(async (req: Request) => {
  const { email } = await req.json() as { email: string };
  if (email) {
    const env = getServerEnv();
    const dbClient = getDb(env.DATABASE_URL);
    const user = await userRepo.findIdByEmail(dbClient, email);
    if (user) {
      const token = await createMagicLink(dbClient, user.id);
      console.log(`[STUB EMAIL] Magic link for ${email}: ${token}`);
    }
  }
  return NextResponse.json(envelopeOk({ ok: true }));
});
