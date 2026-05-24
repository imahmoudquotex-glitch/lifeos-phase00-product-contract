import { NextResponse, type NextRequest } from 'next/server';
import { validateSession } from '@lifeos/auth';
import { generateNonce, buildCspHeader } from '@lifeos/security';

/**
 * (3.15) Next.js middleware — extended for Phase 05:
 * - Session validation on protected routes
 * - CSP nonce injection
 * - Rate-limit pre-check header passthrough
 * ADR-0025: runs after Zenith merge
 * ADR-0027: CSRF handled in route HOC, not middleware
 */

const PUBLIC_PATHS = new Set([
	'/signin',
	'/signup',
	'/reset',
	'/api/v1/auth/signin',
	'/api/v1/auth/signup',
	'/api/v1/auth/reset',
	'/api/v1/auth/oauth/callback',
]);

function isPublic(pathname: string): boolean {
	if (PUBLIC_PATHS.has(pathname)) return true;
	if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) return true;
	if (pathname.endsWith('.webmanifest') || pathname.endsWith('.ico')) return true;
	return false;
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
	const { pathname } = req.nextUrl;
	const nonce = generateNonce();
	const csp = buildCspHeader(nonce, '/api/v1/csp-report');

	const requestHeaders = new Headers(req.headers);
	requestHeaders.set('x-nonce', nonce);

	const response = NextResponse.next({ request: { headers: requestHeaders } });
	response.headers.set('Content-Security-Policy', csp);
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	if (isPublic(pathname)) return response;

	const sessionCookie = req.cookies.get('lifeos_sid')?.value;
	if (!sessionCookie) {
		return NextResponse.redirect(new URL('/signin', req.url));
	}

	try {
		const session = await validateSession(sessionCookie);
		if (!session) {
			return NextResponse.redirect(new URL('/signin', req.url));
		}
		requestHeaders.set('x-user-id', session.userId);
		requestHeaders.set('x-workspace-id', session.workspaceId);
		return NextResponse.next({ request: { headers: requestHeaders } });
	} catch {
		return NextResponse.redirect(new URL('/signin', req.url));
	}
}

export const config = {
	matcher: [
		'/((?!_next/static|_next/image|favicon.ico|.*\\.webmanifest).*)',
	],
};
