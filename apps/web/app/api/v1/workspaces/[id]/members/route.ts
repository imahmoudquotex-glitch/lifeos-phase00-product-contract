import { NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/route';
import { membershipService } from '@lifeos/workspaces';
import { requireCapability } from '@lifeos/auth-guard';
import type { WorkspaceRole } from '@lifeos/permissions';
import { envelopeOk } from '@lifeos/shared';

export const GET = withWorkspaceRoute(async (_req, _params, context) => {
  requireCapability(context.role as WorkspaceRole, 'member:list');
  const members = await membershipService.listMembers(context.dbClient, context.workspaceId);
  return NextResponse.json(envelopeOk({ members }));
});
