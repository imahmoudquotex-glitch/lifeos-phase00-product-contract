import { withWorkspaceRoute } from '@lifeos/route';
import { NextResponse } from 'next/server';
export const GET = withWorkspaceRoute(async () => NextResponse.json({}));
export const POST = withWorkspaceRoute(async () => NextResponse.json({}));
