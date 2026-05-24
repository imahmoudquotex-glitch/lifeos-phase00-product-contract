import { NextRequest, NextResponse } from 'next/server';
import { withApiErrorHandling } from '@lifeos/route';
import { db } from '@lifeos/db';
import { createMagicLink, userRepo } from '@lifeos/auth';
import { envelopeOk } from '@lifeos/shared';

export const POST = withApiErrorHandling(async (req: Request) => {
  const { email } = await req.json();
  if (email) {
    const user = await userRepo.findIdByEmail(email);
    if (user) {
      const token = await createMagicLink(db, user.id);
      console.log(`[STUB EMAIL] Magic link for ${email}: ${token}`);
    }
  }
  return NextResponse.json(envelopeOk({ ok: true }));
});
