import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@lifeos/auth-guard';
import { workspaceService } from '@lifeos/workspaces';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';
import { envelopeOk } from '@lifeos/shared';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUser(req);
    const env = getServerEnv();
    const dbClient = getDb(env.DATABASE_URL);
    const rows = await workspaceService.listUserWorkspaces(dbClient, userId);
    return NextResponse.json(envelopeOk({ data: rows }));
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: { code: 'AUTH_REQUIRED', message: err.message } }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUser(req);
    const { name, slug } = await req.json();
    
    const env = getServerEnv();
    const dbClient = getDb(env.DATABASE_URL);
    const { id, slug: resSlug, name: resName } = await workspaceService.createWorkspace(dbClient, userId, name, slug);
    
    return NextResponse.json(envelopeOk({ data: { id, slug: resSlug, name: resName } }), { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: { code: 'UNKNOWN', message: err.message } }, { status: 500 });
  }
}
