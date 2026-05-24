import { withWorkspaceRoute } from '@lifeos/route';
import { NextResponse } from 'next/server';
export const PUT = withWorkspaceRoute(async () => NextResponse.json({}));
export const DELETE = withWorkspaceRoute(async () => NextResponse.json({}));
