import { NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/route';
import { membershipService } from '@lifeos/workspaces';
import { requireCapability } from '@lifeos/auth-guard';
import type { WorkspaceRole } from '@lifeos/permissions';
import { envelopeOk } from '@lifeos/shared';

export const PUT = withWorkspaceRoute(async (req, params, context) => {
  requireCapability(context.role as WorkspaceRole, 'member:update');
  const { role } = await req.json();
  const membership = await membershipService.updateRole(context.dbClient, context.workspaceId, params.userId, role);
  return NextResponse.json(envelopeOk({ membership }));
});

export const DELETE = withWorkspaceRoute(async (_req, params, context) => {
  requireCapability(context.role as WorkspaceRole, 'member:remove');
  await membershipService.removeMember(context.dbClient, context.workspaceId, params.userId);
  return NextResponse.json(envelopeOk({ success: true }));
});
