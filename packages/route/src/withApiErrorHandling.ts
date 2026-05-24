import { AppError, envelopeErr, statusForError } from '@lifeos/shared';

type RouteHandler = (req: Request) => Promise<Response>;

/**
 * Wraps a Next.js App Router route handler.
 * Catches any thrown Error / AppError and converts it to an API envelope failure response.
 */
export function withApiErrorHandling(handler: RouteHandler): RouteHandler {
	return async (req: Request): Promise<Response> => {
		try {
			return await handler(req);
		} catch (e) {
			const error =
				e instanceof Error ? e : new AppError('UNKNOWN', 'An unexpected error occurred');
			const status = statusForError(error);
			return Response.json(envelopeErr(error), { status });
		}
	};
}
