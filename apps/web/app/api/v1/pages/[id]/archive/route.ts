import { NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/route';
import { pageService } from '@lifeos/pages';
import { envelopeOk } from '@lifeos/shared';

export const POST = withWorkspaceRoute(async (req, params, context) => {
  const page = await pageService.archive(context.dbClient, params.id, context.workspaceId);
  return NextResponse.json(envelopeOk({ page }));
});
