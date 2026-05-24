import { NextResponse, type NextRequest } from 'next/server';

/**
 * Minimal Edge middleware.
 * Auth protection handled client-side via Supabase session.
 * CSP nonce injected here for security.
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...Array.from(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function middleware(req: NextRequest): NextResponse {
  const nonce = generateNonce();
  const res = NextResponse.next();
  res.headers.set('x-nonce', nonce);
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
