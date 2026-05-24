import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@lifeos/auth-guard';
import { workspaceService } from '@lifeos/workspaces';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUser(req);
    const rows = await workspaceService.listUserWorkspaces(userId);
    return NextResponse.json({ ok: true, data: rows });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: { code: 'AUTH_REQUIRED', message: err.message } }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUser(req);
    const { name, slug } = await req.json();
    
    const { id, slug: resSlug, name: resName } = await workspaceService.createWorkspace(userId, name, slug);
    
    return NextResponse.json({ ok: true, data: { id, slug: resSlug, name: resName } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: { code: 'UNKNOWN', message: err.message } }, { status: 500 });
  }
}
