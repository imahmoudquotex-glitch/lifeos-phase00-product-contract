import { type NextRequest } from 'next/server';
import { envelopeOk, envelopeErr, AppError, PHASE_05_STATUS_MAP } from '@lifeos/shared';
import { signUp } from '@lifeos/auth';
import { withCsrfProtection, withRateLimit } from '@lifeos/web-guards';

function statusFor(code: string): number {
	return (PHASE_05_STATUS_MAP as Record<string, number>)[code] ?? 400;
}

/**
 * POST /api/v1/auth/signup
 * ADR-0027: withCsrfProtection HOC
 * ADR-0029: withRateLimit on IP+email (3 per hour for signup)
 */
const handler = async (
	req: NextRequest,
	body: unknown,
): Promise<Response> => {
	const { email, password, displayName, locale } = body as {
		email: string;
		password: string;
		displayName: string;
		locale?: string;
	};
	try {
		const ua = req.headers.get('user-agent') ?? '';
		const result = await signUp({ email, password, displayName, locale: locale ?? 'en', userAgent: ua });

		const res = Response.json(
			envelopeOk({ redirectTo: '/app', userId: result.userId }),
			{ status: 201 },
		);
		res.headers.append(
			'Set-Cookie',
			`lifeos_sid=${result.sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 3600}`,
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
		bucketPrefix: 'auth:signup',
		maxAttempts: 3,
		windowSeconds: 3600,
		lockoutSeconds: 7200,
		keyFn: (req, body) => {
			const ip =
				req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
			const email = ((body as { email?: string })?.email ?? '').toLowerCase();
			return `${ip}:${email}`;
		},
	})(handler),
);
