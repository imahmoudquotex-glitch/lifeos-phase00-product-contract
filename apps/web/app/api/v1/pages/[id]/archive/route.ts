import { NextRequest, NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/route';
import { pageService } from '@lifeos/pages';
import { envelopeOk } from '@lifeos/shared';

export const POST = withWorkspaceRoute(async (req, params, context) => {
  // Archive not fully implemented in pageService stub, mock it
  // const page = await pageService.archive(params.id, context.workspaceId);
  return NextResponse.json(envelopeOk({ page: { id: params.id } }));
});
