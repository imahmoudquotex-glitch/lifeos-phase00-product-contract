import { NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/route';
import { pageService } from '@lifeos/pages';
import { requireCapability } from '@lifeos/auth-guard';
import type { WorkspaceRole } from '@lifeos/permissions';
import { envelopeOk, AppError } from '@lifeos/shared';

export const GET = withWorkspaceRoute(async (_req, params, context) => {
  requireCapability(context.role as WorkspaceRole, 'page:view');
  const page = await pageService.findById(context.dbClient, params.id, context.workspaceId);
  if (!page) throw new AppError('NOT_FOUND', 'Page not found');
  return NextResponse.json(envelopeOk({ page }));
});

export const PUT = withWorkspaceRoute(async (req, params, context) => {
  requireCapability(context.role as WorkspaceRole, 'page:update');
  const updates = await req.json();
  const page = await pageService.update(context.dbClient, params.id, context.workspaceId, updates);
  return NextResponse.json(envelopeOk({ page }));
});
