import { withWorkspaceRoute } from '@lifeos/route';
import { NextResponse } from 'next/server';
export const GET = withWorkspaceRoute(async () => NextResponse.json({}));
export const PUT = withWorkspaceRoute(async () => NextResponse.json({}));
