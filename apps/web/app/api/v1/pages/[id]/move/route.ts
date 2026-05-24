import { NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/route';
import { pageService } from '@lifeos/pages';
import { envelopeOk } from '@lifeos/shared';

export const POST = withWorkspaceRoute(async (req, params, context) => {
  const { parentId, position: _position } = await req.json();
  const page = await pageService.movePage(context.dbClient, params.id, parentId, context.workspaceId);
  return NextResponse.json(envelopeOk({ page }));
});
