import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@lifeos/auth-guard';
import { db } from '@lifeos/db';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUser(req);
    const result = await db.query(
      `SELECT u.id, u.email, u.display_name, p.avatar_url, p.timezone 
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );
    return NextResponse.json({ ok: true, data: result.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: { code: 'AUTH_REQUIRED', message: err.message } }, { status: 401 });
  }
}
