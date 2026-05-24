import { NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/route';
import { invitationService } from '@lifeos/workspaces';
import { requireCapability } from '@lifeos/auth-guard';
import type { WorkspaceRole } from '@lifeos/permissions';
import { envelopeOk } from '@lifeos/shared';

export const GET = withWorkspaceRoute(async (_req, _params, context) => {
  requireCapability(context.role as WorkspaceRole, 'invitation:list');
  const invitations = await invitationService.listByWorkspace(context.dbClient, context.workspaceId);
  return NextResponse.json(envelopeOk({ invitations }));
});

export const POST = withWorkspaceRoute(async (req, _params, context) => {
  requireCapability(context.role as WorkspaceRole, 'invitation:create');
  const { email, role } = await req.json();
  const invitation = await invitationService.create(context.dbClient, context.workspaceId, email, role, context.userId);
  return NextResponse.json(envelopeOk({ invitation }));
});
