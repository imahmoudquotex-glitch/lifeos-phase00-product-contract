import { NextRequest, NextResponse } from 'next/server';
import { generateNonce, buildCspHeader } from '@lifeos/security';

const CSP_REPORT_URI = process.env['CSP_REPORT_URI'] ?? '/api/_csp-report';

export function middleware(req: NextRequest) {
	const nonce = generateNonce();
	const csp = buildCspHeader(nonce, CSP_REPORT_URI);

	const requestHeaders = new Headers(req.headers);
	requestHeaders.set('x-csp-nonce', nonce);

	const res = NextResponse.next({
		request: { headers: requestHeaders },
	});

	res.headers.set('Content-Security-Policy', csp);
	res.headers.set('X-Frame-Options', 'DENY');
	res.headers.set('X-Content-Type-Options', 'nosniff');
	res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	return res;
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
