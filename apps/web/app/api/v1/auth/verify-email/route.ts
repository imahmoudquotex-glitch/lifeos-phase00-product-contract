import { NextRequest, NextResponse } from 'next/server';
import { withApiErrorHandling } from '@lifeos/route';
import { db } from '@lifeos/db';
import { consumeEmailVerification, userRepo } from '@lifeos/auth';
import { envelopeOk } from '@lifeos/shared';

export const POST = withApiErrorHandling(async (req: Request) => {
  const { token } = await req.json();
  const userId = await consumeEmailVerification(db, token);
  await userRepo.markEmailVerified(userId);
  return NextResponse.json(envelopeOk({ ok: true }));
});
