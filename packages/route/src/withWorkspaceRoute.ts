// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '@lifeos/shared/errors';
import { requireUser, requireWorkspace } from '@lifeos/auth-guard';
import { withWorkspaceContext } from '@lifeos/auth/workspace-context';

export function withWorkspaceRoute(
  handler: (req: NextRequest, params: any, context: { userId: string; workspaceId: string; role: string; dbClient: any }) => Promise<NextResponse>
) {
  return async (req: NextRequest, params: any) => {
    try {
      const userId = await requireUser(req);
      const url = new URL(req.url);
      const workspaceId = url.searchParams.get('workspaceId');
      
      if (!workspaceId) {
        throw new AppError('VALIDATION_FAILED', 'workspaceId query parameter is required');
      }

      const { role } = await requireWorkspace(userId, workspaceId);
      
      return await withWorkspaceContext(userId, workspaceId, async (client) => {
        return handler(req, params, { userId, workspaceId, role, dbClient: client });
      });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json({ ok: false, error: { code: err.code, message: err.message } }, { status: 400 });
      }
      return NextResponse.json({ ok: false, error: { code: 'UNKNOWN', message: 'Internal Server Error' } }, { status: 500 });
    }
  };
}
