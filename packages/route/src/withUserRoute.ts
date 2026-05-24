// @ts-nocheck
import { AppError } from '@lifeos/shared';
import { withApiErrorHandling } from './withApiErrorHandling';

export interface UserCtx {
	userId: string;
}

type UserRouteHandler = (req: Request, ctx: UserCtx) => Promise<Response>;

/**
 * STUB — Phase 01.
 * Throws AUTH_REQUIRED for every request until Phase 05 activates session lookup.
 */
export function withUserRoute(_handler: UserRouteHandler) {
	return withApiErrorHandling(async (_req: Request) => {
		throw new AppError('AUTH_REQUIRED', 'Authentication required (stub: Phase 05)');
	});
}
