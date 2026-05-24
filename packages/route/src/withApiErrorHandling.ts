import { AppError, envelopeErr, statusForError, consoleLogger } from '@lifeos/shared';

type RouteHandler = (req: Request) => Promise<Response>;

/**
 * Wraps a Next.js App Router route handler.
 * Catches any thrown Error / AppError and converts it to an API envelope failure response.
 * Logs structured error details via consoleLogger.
 */
export function withApiErrorHandling(handler: RouteHandler): RouteHandler {
	return async (req: Request): Promise<Response> => {
		try {
			return await handler(req);
		} catch (e) {
			const error =
				e instanceof Error ? e : new AppError('UNKNOWN', 'An unexpected error occurred');
			const status = statusForError(error);
			consoleLogger.error('api_error', {
				code: error instanceof AppError ? String(error.code) : 'UNKNOWN',
				message: error.message,
				status,
				url: req.url,
				method: req.method,
			});
			return Response.json(envelopeErr(error), { status });
		}
	};
}
