// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@lifeos/auth-guard';
import { db } from '@lifeos/db';
import { newUlid } from '@lifeos/shared/ids';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUser(req);
    const result = await db.query(
      `SELECT w.id, w.slug, w.name, wm.role
       FROM workspaces w
       JOIN workspace_memberships wm ON w.id = wm.workspace_id
       WHERE wm.user_id = $1 AND wm.removed_at IS NULL AND w.archived_at IS NULL`,
      [userId]
    );
    return NextResponse.json({ ok: true, data: result.rows });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: { code: 'AUTH_REQUIRED', message: err.message } }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUser(req);
    const { name, slug } = await req.json();
    const id = newUlid();
    const memId = newUlid();
    
    await db.query('BEGIN');
    await db.query(
      `INSERT INTO workspaces (id, slug, name, type, owner_user_id) VALUES ($1, $2, $3, 'team', $4)`,
      [id, slug, name, userId]
    );
    await db.query(
      `INSERT INTO workspace_memberships (id, workspace_id, user_id, role) VALUES ($1, $2, $3, 'owner')`,
      [memId, id, userId]
    );
    await db.query('COMMIT');
    
    return NextResponse.json({ ok: true, data: { id, slug, name } });
  } catch (err: any) {
    await db.query('ROLLBACK');
    return NextResponse.json({ ok: false, error: { code: 'UNKNOWN', message: err.message } }, { status: 500 });
  }
}
