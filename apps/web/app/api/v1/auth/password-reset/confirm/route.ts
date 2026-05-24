import { NextRequest, NextResponse } from 'next/server';
import { withApiErrorHandling } from '@lifeos/route';
import { db } from '@lifeos/db';
import { consumePasswordReset, hashPassword, rotateOnPrivilegeChange, userRepo } from '@lifeos/auth';
import { envelopeOk } from '@lifeos/shared';

export const POST = withApiErrorHandling(async (req: any, context: any) => {
  const { token, newPassword } = await req.json();
  const userId = await consumePasswordReset(db, token);
  const hash = await hashPassword(newPassword);
  await userRepo.updatePassword(userId, hash);
  await rotateOnPrivilegeChange(db, userId);
  return NextResponse.json(envelopeOk({ ok: true }));
});
