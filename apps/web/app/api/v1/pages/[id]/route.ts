import { type NextRequest, NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/auth-guard';
import { pageService } from '@lifeos/pages';
import { envelopeOk, AppError } from '@lifeos/shared';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withWorkspaceRoute(req, null, { capability: 'page:read' }, async (ctx) => {
    const page = await pageService.findById(ctx.tx, params.id, ctx.workspaceId);
    if (!page) throw new AppError('NOT_FOUND', 'Page not found');
    return NextResponse.json(envelopeOk({ page }));
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return withWorkspaceRoute(req, null, { csrfProtect: true, capability: 'page:update' }, async (ctx) => {
    const updates = await req.json() as { title?: string };
    const page = await pageService.update(ctx.tx, params.id, ctx.workspaceId, updates);
    return NextResponse.json(envelopeOk({ page }));
  });
}
