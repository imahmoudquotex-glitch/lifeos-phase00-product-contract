import { NextRequest, NextResponse } from 'next/server';

/**
 * P1-027: /api/v1/auth/logout is a legacy alias for /api/v1/auth/signout.
 * Redirect to canonical Phase 05 endpoint to avoid duplicate implementations.
 * Clients should migrate to POST /api/v1/auth/signout.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const canonical = new URL('/api/v1/auth/signout', req.url);
  return NextResponse.rewrite(canonical);
}
