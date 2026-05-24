import { NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/route';
import { pageService } from '@lifeos/pages';
import { envelopeOk } from '@lifeos/shared';
import { requireCapability } from '@lifeos/auth-guard';
import type { WorkspaceRole } from '@lifeos/permissions';

export const GET = withWorkspaceRoute(async (req, params, context) => {
  const pages = await pageService.getTree(context.dbClient, context.workspaceId);
  return NextResponse.json(envelopeOk({ pages }));
});

export const POST = withWorkspaceRoute(async (req, params, context) => {
  requireCapability(context.role as WorkspaceRole, 'page:create');
  const { title, parentId } = await req.json();
  const page = await pageService.createPage(context.dbClient, {
    workspaceId: context.workspaceId,
    title,
    parentId,
  });
  return NextResponse.json(envelopeOk({ page }));
});
