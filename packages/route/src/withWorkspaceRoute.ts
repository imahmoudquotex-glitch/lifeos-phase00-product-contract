import { NextResponse, type NextRequest } from 'next/server';
import { AppError, envelopeErr, statusForError } from '@lifeos/shared';
import { withWorkspaceRoute, type WorkspaceRouteContext } from '@lifeos/auth-guard';
import type { WithWorkspaceRouteOptions } from '@lifeos/auth-guard';

/**
 * Re-exports withWorkspaceRoute from @lifeos/auth-guard with Next.js Response wrapping.
 * This package/route version is the approved import for route handlers.
 */
export type { WorkspaceRouteContext, WithWorkspaceRouteOptions };
export { withWorkspaceRoute };

/**
 * Next.js App Router HOC — wraps withWorkspaceRoute with error-to-Response conversion.
 * Use this in route.ts files:
 *
 * ```ts
 * export const GET = createWorkspaceHandler(
 *   { capability: 'page:read' },
 *   async (ctx) => NextResponse.json(envelopeOk(await getPages(ctx.tx, ctx.workspaceId)))
 * );
 * ```
 */
export function createWorkspaceHandler(
  options: WithWorkspaceRouteOptions,
  handler: (ctx: WorkspaceRouteContext) => Promise<NextResponse>,
) {
  return async (
    req: NextRequest,
    { params }: { params: { workspaceId?: string } },
  ): Promise<NextResponse> => {
    try {
      return await withWorkspaceRoute(
        req,
        params.workspaceId ?? null,
        options,
        handler,
      );
    } catch (e) {
      const err = e instanceof Error ? e : new AppError('UNKNOWN', 'Unexpected server error');
      const status = statusForError(err);
      return NextResponse.json(envelopeErr(err), { status });
    }
  };
}
