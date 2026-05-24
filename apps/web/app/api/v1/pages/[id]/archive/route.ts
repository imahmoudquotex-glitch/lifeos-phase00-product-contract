import { NextResponse, type NextRequest } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/auth-guard';
import { pageService } from '@lifeos/pages';
import { envelopeOk } from '@lifeos/shared';

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
  return withWorkspaceRoute(req, null, { csrfProtect: true, capability: 'page:archive' }, async (ctx) => {
    const page = await pageService.archive(ctx.tx, params.id, ctx.workspaceId);
    return NextResponse.json(envelopeOk({ page }));
  });
}
