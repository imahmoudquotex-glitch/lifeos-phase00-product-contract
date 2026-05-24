import { type NextRequest, NextResponse } from 'next/server';
import { logger } from '@lifeos/shared';

export async function POST(req: NextRequest) {
	const body = await req.json().catch(() => ({}));
	logger.warn({ event: 'csp_violation', report: body });
	return new NextResponse(null, { status: 204 });
}
