import { NextResponse, type NextRequest } from 'next/server';
import { AppError, envelopeErr, statusForError } from '@lifeos/shared';
import { requireUser } from './requireUser';
import { requireWorkspace } from './requireWorkspace';
import { validateCsrf } from './csrf';
import type { Capability, WorkspaceRole } from '@lifeos/permissions/capabilities';
import { hasCapability } from '@lifeos/permissions/resolver';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';
import type { DbClient } from '@lifeos/db';

/**
 * Phase 02 WorkspaceRouteContext — injected into every route handler.
 * Matches contract from Phase 02 Step 27.5.
 */
export interface WorkspaceRouteContext {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  /** Active database client — use this inside the handler, not a global singleton. */
  tx: DbClient;
}

export interface WithWorkspaceRouteOptions {
  /**
   * Required capability — throws AUTH_FORBIDDEN (403) if role is insufficient.
   * Check happens AFTER membership confirmation (non-members still get 404).
   */
  capability?: Capability;
  /**
   * Set to true on every mutating route (POST / PUT / PATCH / DELETE).
   * Validates X-CSRF-Token header against __csrf cookie before any DB work.
   */
  csrfProtect?: boolean;
}

/**
 * Unified authentication + authorization wrapper — Phase 02 contract.
 *
 * Composition order (ADR-0008, Phase 02 §27.5):
 *   1. Extract session cookie via SESSION_COOKIE_NAME → userId   (requireUser)
 *   2. Accept workspace from X-Workspace-Id header OR query param
 *   3. Verify membership → role (404 on non-member, hides existence)  (requireWorkspace)
 *   4. Validate CSRF token (if mutating)                               (validateCsrf)
 *   5. Assert capability (if supplied) → 403 AUTH_FORBIDDEN            (hasCapability)
 *   6. Call handler with { userId, workspaceId, role, tx: DbClient }
 *
 * Usage:
 * ```ts
 * export const POST = (req: NextRequest, { params }: { params: { id: string } }) =>
 *   withWorkspaceRoute(req, params.id, { csrfProtect: true, capability: 'page:create' },
 *     async (ctx) => {
 *       const page = await createPage(ctx.tx, ctx.userId, ctx.workspaceId, ...);
 *       return NextResponse.json(envelopeOk(page));
 *     }
 *   );
 * ```
 */
export async function withWorkspaceRoute<T>(
  req: NextRequest,
  rawWorkspaceId: string | undefined | null,
  options: WithWorkspaceRouteOptions,
  handler: (ctx: WorkspaceRouteContext) => Promise<T>,
): Promise<T> {
  // Step 1 — Session authentication
  const userId = await requireUser(req);

  // Step 2 — Workspace resolution: header takes precedence over query param
  const workspaceId =
    req.headers.get('x-workspace-id')
    ?? req.nextUrl.searchParams.get('workspaceId')
    ?? rawWorkspaceId
    ?? null;

  if (!workspaceId) {
    throw new AppError('VALIDATION_FAILED', 'workspaceId is required (header or query param).');
  }

  // Step 3 — Membership check (WORKSPACE_NOT_FOUND → 404, prevents enumeration)
  const { role } = await requireWorkspace(userId, workspaceId);

  // Step 4 — CSRF for mutating routes
  if (options.csrfProtect) {
    validateCsrf(req);
  }

  // Step 5 — Capability gate
  if (options.capability) {
    if (!hasCapability(role, options.capability)) {
      throw new AppError('AUTH_FORBIDDEN', `Missing capability: ${options.capability}`);
    }
  }

  // Step 6 — Build DbClient and call handler
  const env = getServerEnv();
  const tx: DbClient = getDb(env.DATABASE_URL);

  return handler({ userId, workspaceId, role, tx });
}

/**
 * Next.js App Router compatible HOC wrapper around withWorkspaceRoute.
 * Catches AppError and any other error, returns JSON envelope response.
 */
export function withWorkspaceRouteHandler(
  options: WithWorkspaceRouteOptions,
  handler: (ctx: WorkspaceRouteContext) => Promise<NextResponse>,
) {
  return async (
    req: NextRequest,
    { params }: { params: { workspaceId?: string; id?: string } },
  ): Promise<NextResponse> => {
    try {
      return await withWorkspaceRoute(
        req,
        params.workspaceId ?? null,
        options,
        handler,
      );
    } catch (e) {
      const err = e instanceof Error ? e : new AppError('UNKNOWN', 'Unexpected error');
      const status = statusForError(err);
      return NextResponse.json(envelopeErr(err), { status });
    }
  };
}
