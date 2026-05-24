import { type NextRequest, NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/route';
import { workspaceService } from '@lifeos/workspaces';
import { envelopeOk } from '@lifeos/shared';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withWorkspaceRoute(req, params.id, { capability: 'page:read' }, async (ctx) => {
    const workspaces = await workspaceService.listUserWorkspaces(ctx.tx, ctx.userId);
    return NextResponse.json(envelopeOk({ workspace: workspaces.find((w: any) => w.id === params.id) ?? null }));
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  return withWorkspaceRoute(req, params.id, { csrfProtect: true, capability: 'workspace:update' }, async (ctx) => {
    const { name, slug } = await req.json() as { name: string; slug: string };
    const updated = await workspaceService.update(ctx.tx, params.id, name, slug, ctx.userId);
    return NextResponse.json(envelopeOk({ workspace: updated }));
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return withWorkspaceRoute(req, params.id, { csrfProtect: true, capability: 'workspace:archive' }, async (ctx) => {
    const archived = await workspaceService.archive(ctx.tx, params.id, ctx.userId);
    return NextResponse.json(envelopeOk({ workspace: archived }));
  });
}
