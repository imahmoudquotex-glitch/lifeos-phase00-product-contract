import { NextRequest, NextResponse } from 'next/server';

/**
 * P1-027: /api/v1/auth/login is a legacy alias for /api/v1/auth/signin.
 * Redirect to canonical Phase 05 endpoint to avoid duplicate auth implementations
 * and ensure all security wrappers (CSRF, rate limit) are applied consistently.
 *
 * Clients should migrate to POST /api/v1/auth/signin.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const canonical = new URL('/api/v1/auth/signin', req.url);
  return NextResponse.rewrite(canonical);
}
