import { AppError } from '@lifeos/shared';
import { requireUser } from './requireUser';
import { requireWorkspace } from './requireWorkspace';
import { validateCsrf } from './csrf';
import type { Capability, WorkspaceRole } from '@lifeos/permissions/capabilities';
import { hasCapability } from '@lifeos/permissions/resolver';

export interface WorkspaceRouteContext {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
}

export interface WithWorkspaceRouteOptions {
  /**
   * When provided, throws if the authenticated member's role does not have
   * this capability. The error will surface as 403 AUTH_FORBIDDEN — but ONLY
   * after membership is confirmed (so workspace existence is still hidden from
   * non-members who get a 404).
   */
  capability?: Capability;
  /**
   * Set to true on every state-mutating route (POST / PUT / PATCH / DELETE).
   * Calls validateCsrf(req) before any DB work.
   * Default: false (safe for GET).
   */
  csrfProtect?: boolean;
}

/**
 * Unified authentication + authorisation wrapper for tenant-scoped API routes.
 *
 * Composition order (per Plan §27.5 + ADR 0008):
 *   1. Extract session → userId               (requireUser)
 *   2. Verify membership → role               (requireWorkspace, 404 on non-member)
 *   3. Validate CSRF token (if mutating)      (validateCsrf)
 *   4. Assert capability (if supplied)        (requireCapability – 403 for role mismatch)
 *   5. Call the handler with typed context
 *
 * Usage in a Next.js Route Handler:
 * ```ts
 * export const POST = (req: Request, { params }: { params: { id: string } }) =>
 *   withWorkspaceRoute(req, params.id, { csrfProtect: true, capability: 'page:create' },
 *     async ({ userId, workspaceId, role }) => {
 *       // handler body — never reached unless all guards pass
 *     }
 *   );
 * ```
 */
export async function withWorkspaceRoute<T>(
  req: Request,
  workspaceId: string,
  options: WithWorkspaceRouteOptions,
  handler: (ctx: WorkspaceRouteContext) => Promise<T>,
): Promise<T> {
  // Step 1 — Session authentication
  const userId = await requireUser(req);

  // Step 2 — Workspace membership (throws WORKSPACE_NOT_FOUND → 404 if not member)
  const { role } = await requireWorkspace(userId, workspaceId);

  // Step 3 — CSRF protection for mutating routes
  if (options.csrfProtect) {
    validateCsrf(req);
  }

  // Step 4 — Capability gate (optional; throws AUTH_FORBIDDEN → 403 if denied)
  if (options.capability) {
    if (!hasCapability(role as WorkspaceRole, options.capability)) {
      throw new AppError(
        'AUTH_FORBIDDEN',
        `Missing capability: ${options.capability}`,
      );
    }
  }

  // Step 5 — Execute the route handler with a fully-typed context
  return handler({ userId, workspaceId, role: role as WorkspaceRole });
}
