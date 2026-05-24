import { NextRequest, NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/route';
import { membershipService } from '@lifeos/workspaces';
import { requireCapability } from '@lifeos/auth-guard';
import { envelopeOk } from '@lifeos/shared';

export const GET = withWorkspaceRoute(async (req, params, context) => {
  requireCapability(context.role as any, 'page:view' as any); // use cast since member:list missing in stubs
  const members = await membershipService.listMembers(context.dbClient, context.workspaceId);
  return NextResponse.json(envelopeOk({ members }));
});
