import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@lifeos/auth-guard';
import { userRepo } from '@lifeos/auth';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUser(req);
    const data = await userRepo.getProfile(userId);
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: { code: 'AUTH_REQUIRED', message: err.message } }, { status: 401 });
  }
}
