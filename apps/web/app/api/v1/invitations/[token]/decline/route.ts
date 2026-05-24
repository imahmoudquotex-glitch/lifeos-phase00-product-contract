import { NextRequest, NextResponse } from 'next/server';
import { withApiErrorHandling } from '@lifeos/route';
import { invitationService } from '@lifeos/workspaces';
import { envelopeOk } from '@lifeos/shared';
import { requireUser } from '@lifeos/auth-guard';
import { db } from '@lifeos/db';

export const POST = withApiErrorHandling(async (req: Request, { params }: { params: { token: string } }) => {
  const userId = await requireUser(req);
  await invitationService.decline(db, userId, params.token);
  return NextResponse.json(envelopeOk({ ok: true }));
});
