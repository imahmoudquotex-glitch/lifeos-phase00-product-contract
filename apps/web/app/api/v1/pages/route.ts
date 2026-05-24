import { type NextRequest, NextResponse } from 'next/server';
import { withWorkspaceRoute } from '@lifeos/route';
import { pageService } from '@lifeos/pages';
import { envelopeOk } from '@lifeos/shared';
import { requireCapability } from '@lifeos/auth-guard';
import { parseJsonBody, requireIdempotencyKey } from '@lifeos/route';
import { z } from 'zod';

const createPageSchema = z.object({
  title: z.string().min(1).max(512),
  parentId: z.string().optional().nullable(),
});

/**
 * GET /api/v1/pages?workspaceId=...
 * Phase 02/03: Read pages tree for workspace.
 * Capability: page:read
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withWorkspaceRoute(req, null, { capability: 'page:read' }, async (ctx) => {
    const pages = await pageService.getTree(ctx.tx, ctx.workspaceId);
    return NextResponse.json(envelopeOk({ pages }));
  }) as Promise<NextResponse>;
}

/**
 * POST /api/v1/pages?workspaceId=...
 * Phase 02/03: Create a new page.
 * Requires: Idempotency-Key header, CSRF, page:create capability.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withWorkspaceRoute(
    req,
    null,
    { csrfProtect: true, capability: 'page:create' },
    async (ctx) => {
      requireIdempotencyKey(req);

      // parseJsonBody instead of raw req.json()
      const body = await parseJsonBody(req, createPageSchema);

      const page = await pageService.createPage(ctx.tx, {
        workspaceId: ctx.workspaceId,
        createdBy: ctx.userId,
        title: body.title,
        parentId: body.parentId ?? null,
      });
      return NextResponse.json(envelopeOk({ page }), { status: 201 });
    },
  ) as Promise<NextResponse>;
}
