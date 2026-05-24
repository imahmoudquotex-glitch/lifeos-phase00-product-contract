import { type NextRequest, NextResponse } from 'next/server';
import { withApiErrorHandling } from '@lifeos/route';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';
import { invitationService } from '@lifeos/workspaces';
import { envelopeOk, AppError } from '@lifeos/shared';

type Params = { params: { token: string } };

export const GET = withApiErrorHandling(async (_req: Request, { params }: Params) => {
  const env = getServerEnv();
  const dbClient = getDb(env.DATABASE_URL);
  const invitation = await invitationService.findByToken(dbClient, params.token);
  if (!invitation) throw new AppError('NOT_FOUND', 'Invitation not found or expired');
  return NextResponse.json(envelopeOk({ invitation }));
});
