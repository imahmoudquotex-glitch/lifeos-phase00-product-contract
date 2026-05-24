import type { NextRequest } from 'next/server';
import { verifyCsrf } from '@lifeos/security';
import { AppError, envelopeErr } from '@lifeos/shared';

type Handler = (req: NextRequest) => Promise<Response>;

/**
 * HOC that enforces CSRF validation on all mutating requests (POST/PUT/PATCH/DELETE).
 * ADR-0027: Every mutating route MUST be wrapped — manual verifyCsrf() calls are forbidden.
 *
 * Token source: double-submit cookie pattern
 *   - Cookie: `lifeos_csrf` (HttpOnly, same-site)
 *   - Header: `x-csrf-token` (sent by client JS)
 */
export function withCsrfProtection(handler: Handler): Handler {
	return async (req) => {
		if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
			return handler(req);
		}
		const cookieToken = req.cookies.get('lifeos_csrf')?.value ?? '';
		const headerToken = req.headers.get('x-csrf-token') ?? '';
		if (!verifyCsrf({ cookieToken, bodyToken: headerToken })) {
			return Response.json(
				envelopeErr(new AppError('CSRF_TOKEN_INVALID', 'CSRF check failed.')),
				{ status: 403 },
			);
		}
		return handler(req);
	};
}
