import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@lifeos/auth-guard';
import { userRepo } from '@lifeos/auth';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUser(req);
    const env = getServerEnv();
    const dbClient = getDb(env.DATABASE_URL);
    const data = await userRepo.getProfile(dbClient, userId);
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: { code: 'AUTH_REQUIRED', message: err.message } }, { status: 401 });
  }
}
