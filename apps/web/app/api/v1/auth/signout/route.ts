import { type NextRequest } from 'next/server';
import { envelopeOk, envelopeErr, AppError, PHASE_05_STATUS_MAP } from '@lifeos/shared';
import { revokeSession } from '@lifeos/auth';
import { withCsrfProtection } from '@lifeos/web-guards';

function statusFor(code: string): number {
	return (PHASE_05_STATUS_MAP as Record<string, number>)[code] ?? 400;
}

/**
 * POST /api/v1/auth/signout
 * Revokes the current session and clears the session cookie.
 * ADR-0027: withCsrfProtection HOC.
 */
const handler = async (req: NextRequest): Promise<Response> => {
	try {
		const sid = req.cookies.get('lifeos_sid')?.value;
		if (sid) {
			await revokeSession(sid);
		}
		const res = Response.json(envelopeOk({ signed_out: true }), { status: 200 });
		// Clear session cookie
		res.headers.append(
			'Set-Cookie',
			`lifeos_sid=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
		);
		return res;
	} catch (e) {
		if (e instanceof AppError) {
			return Response.json(envelopeErr(e), { status: statusFor(e.code as string) });
		}
		throw e;
	}
};

export const POST = withCsrfProtection(handler);
