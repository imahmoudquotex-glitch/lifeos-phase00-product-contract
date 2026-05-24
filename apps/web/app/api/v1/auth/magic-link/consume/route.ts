import { NextRequest, NextResponse } from 'next/server';
import { withApiErrorHandling } from '@lifeos/route';
import { db } from '@lifeos/db';
import { consumeMagicLink, createSession } from '@lifeos/auth';
import { envelopeOk } from '@lifeos/shared';

export const POST = withApiErrorHandling(async (req: Request) => {
  const { token } = await req.json();
  const userId = await consumeMagicLink(db, token);
  const session = await createSession(userId);
  return NextResponse.json(envelopeOk({ userId }), {
    headers: { 'Set-Cookie': `lifeos_sid=${session.token}; HttpOnly; Path=/; SameSite=Lax` }
  });
});
