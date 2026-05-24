import { type NextRequest, NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/route';
import { invitationService } from '@lifeos/workspaces';
import { envelopeOk } from '@lifeos/shared';

type Params = { params: { id: string } };

export async function GET(req: NextRequest, { params }: Params) {
  return withWorkspaceRoute(req, params.id, { capability: 'invitation:list' }, async (ctx) => {
    const invitations = await invitationService.listByWorkspace(ctx.tx, ctx.workspaceId);
    return NextResponse.json(envelopeOk({ invitations }));
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  return withWorkspaceRoute(req, params.id, { csrfProtect: true, capability: 'invitation:create' }, async (ctx) => {
    const { email, role } = await req.json() as { email: string; role: string };
    const invitation = await invitationService.create(ctx.tx, ctx.workspaceId, email, role, ctx.userId);
    return NextResponse.json(envelopeOk({ invitation }), { status: 201 });
  });
}
