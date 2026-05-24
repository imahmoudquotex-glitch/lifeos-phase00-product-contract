import { type NextRequest, NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/auth-guard';
import { membershipService } from '@lifeos/workspaces';
import { envelopeOk } from '@lifeos/shared';

type Params = { params: { id: string; userId: string } };

export async function PUT(req: NextRequest, { params }: Params) {
  return withWorkspaceRoute(req, params.id, { csrfProtect: true, capability: 'member:update' }, async (ctx) => {
    const { role } = await req.json() as { role: string };
    const membership = await membershipService.updateRole(ctx.tx, ctx.workspaceId, params.userId, role);
    return NextResponse.json(envelopeOk({ membership }));
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  return withWorkspaceRoute(req, params.id, { csrfProtect: true, capability: 'member:remove' }, async (ctx) => {
    await membershipService.removeMember(ctx.tx, ctx.workspaceId, params.userId);
    return NextResponse.json(envelopeOk({ success: true }));
  });
}
