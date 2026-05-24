import { NextRequest, NextResponse } from 'next/server';
import { withApiErrorHandling } from '@lifeos/route';
import { invitationService } from '@lifeos/workspaces';
import { envelopeOk } from '@lifeos/shared';
import { requireUser } from '@lifeos/auth-guard';

export const POST = withApiErrorHandling(async (req: any, { params }: { params: { token: string } }) => {
  const userId = await requireUser(req);
  const membership = await invitationService.accept(userId, params.token);
  return NextResponse.json(envelopeOk({ membership }));
});
