import { type NextRequest } from 'next/server';
import { envelopeOk, envelopeErr, AppError, PHASE_05_STATUS_MAP } from '@lifeos/shared';
import { requestPasswordReset, resetPassword } from '@lifeos/auth';
import { withCsrfProtection, withRateLimit } from '@lifeos/web-guards';

function statusFor(code: string): number {
	return (PHASE_05_STATUS_MAP as Record<string, number>)[code] ?? 400;
}

/**
 * POST /api/v1/auth/reset
 * Two modes:
 * - { email } → request reset (sends email, always returns 200 — no user enumeration)
 * - { token, newPassword } → apply reset
 *
 * ADR-0027: withCsrfProtection HOC
 * ADR-0029: withRateLimit (3 per hour per IP+email)
 */
const handler = async (req: NextRequest, body: unknown): Promise<Response> => {
	const { email, token, newPassword } = body as {
		email?: string;
		token?: string;
		newPassword?: string;
	};

	try {
		if (token && newPassword) {
			await resetPassword(token, newPassword);
			return Response.json(envelopeOk({ reset: true }), { status: 200 });
		}

		if (email) {
			await requestPasswordReset(email);
			return Response.json(
				envelopeOk({ message: 'If an account exists, a reset link has been sent.' }),
				{ status: 200 },
			);
		}

		return Response.json(
			envelopeErr(new AppError('AUTH_INVALID_CREDENTIALS', 'email or token+newPassword required.')),
			{ status: 400 },
		);
	} catch (e) {
		if (e instanceof AppError) {
			return Response.json(envelopeErr(e), { status: statusFor(e.code as string) });
		}
		throw e;
	}
};

export const POST = withCsrfProtection(
	withRateLimit({
		bucketPrefix: 'auth:reset',
		maxAttempts: 3,
		windowSeconds: 3600,
		lockoutSeconds: 3600,
		keyFn: (req, body) => {
			const ip =
				req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
			const email = ((body as { email?: string })?.email ?? '').toLowerCase();
			return `${ip}:${email}`;
		},
	})(handler),
);
