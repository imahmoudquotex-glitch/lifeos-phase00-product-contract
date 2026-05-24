import { NextRequest, NextResponse } from 'next/server';
import { withApiErrorHandling } from '@lifeos/route';
import { db } from '@lifeos/db';
import { createPasswordReset, userRepo } from '@lifeos/auth';
import { envelopeOk } from '@lifeos/shared';

export const POST = withApiErrorHandling(async (req: any) => {
  const { email } = await req.json();
  if (email) {
    const user = await userRepo.findIdByEmail(email);
    if (user) {
      const token = await createPasswordReset(db, user.id);
      console.log(`[STUB EMAIL] Password reset for ${email}: ${token}`);
    }
  }
  return NextResponse.json(envelopeOk({ ok: true }));
});
