import { NextResponse } from 'next/server';
import { withApiErrorHandling } from '@lifeos/route';
import { db } from '@lifeos/db';
import { invitationService } from '@lifeos/workspaces';
import { envelopeOk, AppError } from '@lifeos/shared';

export const GET = withApiErrorHandling(async (_req, params) => {
  const invitation = await invitationService.findByToken(db, params.token);
  if (!invitation) throw new AppError('NOT_FOUND', 'Invitation not found or expired');
  return NextResponse.json(envelopeOk({ invitation }));
});
