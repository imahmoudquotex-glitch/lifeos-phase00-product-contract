import { NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/route';
import { pageService } from '@lifeos/pages';
import { envelopeOk } from '@lifeos/shared';
import { requireCapability } from '@lifeos/auth-guard';

export const GET = withWorkspaceRoute(async (req, params, context) => {
  const pages = await pageService.getTree(context.dbClient, context.workspaceId);
  return NextResponse.json(envelopeOk({ pages }));
});

export const POST = withWorkspaceRoute(async (req, params, context) => {
  requireCapability(context.role as any, 'page:manage' as any);
  const { title, parentId } = await req.json();
  const page = await pageService.createPage({
    tx: context.dbClient,
    workspaceId: context.workspaceId,
    title,
    parentId,
    createdById: context.userId,
  });
  return NextResponse.json(envelopeOk({ page }));
});
