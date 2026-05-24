import { NextResponse, type NextRequest } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/auth-guard';
import { pageService } from '@lifeos/pages';
import { envelopeOk } from '@lifeos/shared';

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
  return withWorkspaceRoute(req, null, { csrfProtect: true, capability: 'page:move' }, async (ctx) => {
    const { parentId, position: _position } = await req.json() as { parentId: string; position: number };
    const page = await pageService.movePage(ctx.tx, params.id, parentId, ctx.workspaceId);
    return NextResponse.json(envelopeOk({ page }));
  });
}
