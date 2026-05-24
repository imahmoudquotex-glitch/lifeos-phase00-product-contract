import { type NextRequest, NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/route';
import { membershipService } from '@lifeos/workspaces';
import { envelopeOk } from '@lifeos/shared';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withWorkspaceRoute(req, params.id, { capability: 'member:list' }, async (ctx) => {
    const members = await membershipService.listMembers(ctx.tx, ctx.workspaceId);
    return NextResponse.json(envelopeOk({ members }));
  });
}
