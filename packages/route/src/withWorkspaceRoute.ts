import { AppError } from '@lifeos/shared';
import { withApiErrorHandling } from './withApiErrorHandling';

export interface WorkspaceCtx {
	userId: string;
	workspaceId: string;
}

type WorkspaceRouteHandler = (req: Request, ctx: WorkspaceCtx) => Promise<Response>;

/**
 * STUB — Phase 01.
 * Throws AUTH_REQUIRED for every request until Phase 02/05 activate workspace + session lookup.
 */
export function withWorkspaceRoute(_handler: WorkspaceRouteHandler) {
	return withApiErrorHandling(async (_req: Request) => {
		throw new AppError('AUTH_REQUIRED', 'Authentication required (stub: Phase 02/05)');
	});
}
