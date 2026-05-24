import { NextResponse, type NextRequest } from 'next/server';
import { buildCspHeader, generateNonce } from '@lifeos/security';
import { getServerEnv } from '@lifeos/shared/env';

/**
 * Phase 04 middleware — CSP + Security headers.
 * ADR-0018: strict CSP with per-request nonce (no unsafe-inline).
 * ADR-0020: Session validation done server-side in route guards (withWorkspaceRoute),
 *           NOT client-side via Supabase.
 */
export function middleware(req: NextRequest): NextResponse {
  // generateNonce uses randomBytes(16) from @lifeos/security — not the inline version
  const nonce = generateNonce();

  let reportUri = '/api/_csp-report';
  try {
    const env = getServerEnv();
    reportUri = `${env.APP_URL}/api/_csp-report`;
  } catch {
    // During build/edge cold-start env may not be populated yet
  }

  const res = NextResponse.next({
    request: {
      headers: new Headers(req.headers),
    },
  });

  // Inject nonce so SSR layouts can read it via headers()
  res.headers.set('x-nonce', nonce);

  // Phase 04 required security headers
  res.headers.set('Content-Security-Policy', buildCspHeader(nonce, reportUri));
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  );
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-DNS-Prefetch-Control', 'off');

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static (static assets)
     * - _next/image (Next.js image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
