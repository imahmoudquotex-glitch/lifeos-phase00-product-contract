import { type NextRequest } from 'next/server';
import { envelopeOk, envelopeErr, AppError, PHASE_05_STATUS_MAP } from '@lifeos/shared';
import { signInWithPassword } from '@lifeos/auth';
import { withCsrfProtection, withRateLimit } from '@lifeos/web-guards';

/** Returns HTTP status for a given AppError code, defaulting to 400 */
function statusFor(code: string): number {
	return (PHASE_05_STATUS_MAP as Record<string, number>)[code] ?? 400;
}

/**
 * POST /api/v1/auth/signin
 * ADR-0026: Uses signInWithPassword facade
 * ADR-0027: Wrapped with withCsrfProtection HOC
 * ADR-0029: Wrapped with withRateLimit (IP+email composite, 5/15min)
 */
const handler = async (
	req: NextRequest,
	body: unknown,
): Promise<Response> => {
	const { email, password } = body as { email: string; password: string };
	try {
		const ua = req.headers.get('user-agent') ?? '';
		const result = await signInWithPassword(email, password, ua);

		const res = Response.json(
			envelopeOk({ redirectTo: '/app', locale: result.locale }),
			{ status: 200 },
		);
		res.headers.append(
			'Set-Cookie',
			`lifeos_sid=${result.sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 3600}`,
		);
		return res;
	} catch (e) {
		if (e instanceof AppError) {
			return Response.json(envelopeErr(e), { status: statusFor(e.code as string) });
		}
		throw e;
	}
};

export const POST = withCsrfProtection(
	withRateLimit({
		bucketPrefix: 'auth:signin',
		maxAttempts: 5,
		windowSeconds: 900,
		lockoutSeconds: 3600,
		keyFn: (req, body) => {
			const ip =
				req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
			const email = ((body as { email?: string })?.email ?? '').toLowerCase();
			return `${ip}:${email}`;
		},
	})(handler),
);
