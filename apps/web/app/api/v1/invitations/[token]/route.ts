import { withApiErrorHandling } from '@lifeos/route';
import { NextResponse } from 'next/server';
export const GET = withApiErrorHandling(async () => NextResponse.json({}));
