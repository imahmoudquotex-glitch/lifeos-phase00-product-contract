import { type NextRequest, NextResponse } from 'next/server';
import { withApiErrorHandling } from '@lifeos/route';
import { invitationService } from '@lifeos/workspaces';
import { envelopeOk } from '@lifeos/shared';
import { requireUser } from '@lifeos/auth-guard';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';

type Params = { params: { token: string } };

export const POST = withApiErrorHandling(async (req: Request, { params }: Params) => {
  const userId = await requireUser(req);
  const env = getServerEnv();
  const dbClient = getDb(env.DATABASE_URL);
  const membership = await invitationService.accept(dbClient, userId, params.token);
  return NextResponse.json(envelopeOk({ membership }));
});
