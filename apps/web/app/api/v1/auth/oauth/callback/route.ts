import { type NextRequest } from 'next/server';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';
import { systemClock } from '@lifeos/shared';

/**
 * GET /api/v1/auth/oauth/callback
 * ADR-0020: OAuth PKCE + state verification.
 * D-077: OAuth errors redirect with ?error=... — NOT throw.
 *
 * State token: stored in oauth_state_store, consumed once (replay protection).
 * Token exchange: deferred to Phase 06 (provider credentials not yet configured).
 */
export async function GET(req: NextRequest): Promise<Response> {
	const { searchParams } = new URL(req.url);
	const state = searchParams.get('state') ?? '';
	const code = searchParams.get('code') ?? '';
	const errorParam = searchParams.get('error');

	// Provider returned error (user denied, etc.)
	if (errorParam) {
		return Response.redirect(new URL('/signin?error=oauth_denied', req.url));
	}

	if (!state || !code) {
		return Response.redirect(new URL('/signin?error=oauth_missing_params', req.url));
	}

	// Verify and consume state token (replay protection)
	try {
		const env = getServerEnv();
		const dbClient = getDb(env.DATABASE_URL);
		const stored = await dbClient.oneOrNone<{
			state: string;
			expires_at: Date;
			consumed_at: Date | null;
		}>(
			`SELECT state, expires_at, consumed_at FROM oauth_state_store
			   WHERE state = $1 FOR UPDATE`,
			[state],
		);

		if (!stored) {
			return Response.redirect(new URL('/signin?error=oauth_state_invalid', req.url));
		}
		if (stored.consumed_at) {
			return Response.redirect(new URL('/signin?error=oauth_state_replay', req.url));
		}
		if (new Date(stored.expires_at).getTime() < systemClock.nowMs()) {
			return Response.redirect(new URL('/signin?error=oauth_state_expired', req.url));
		}

		await dbClient.none(
			`UPDATE oauth_state_store SET consumed_at = now() WHERE state = $1`,
			[state],
		);
	} catch {
		return Response.redirect(new URL('/signin?error=oauth_state_invalid', req.url));
	}

	// TODO(Phase 06): exchange `code` with OAuth provider, upsert user, create session
	return Response.redirect(new URL('/signin?error=oauth_not_configured', req.url));
}
