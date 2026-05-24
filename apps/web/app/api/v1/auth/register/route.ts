import { NextRequest, NextResponse } from 'next/server';
import { userRepo } from '@lifeos/auth';
import { hashPassword } from '@lifeos/auth';
import { newUlid } from '@lifeos/shared/ids';
import { AppError } from '@lifeos/shared/errors';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();
    if (!email || !password) throw new AppError('VALIDATION_FAILED', 'Missing email or password');
    
    const id = newUlid();
    const hash = await hashPassword(password);
    const env = getServerEnv();
    const dbClient = getDb(env.DATABASE_URL);
    
    await userRepo.createUser(dbClient, email, hash, displayName || '');
    
    return NextResponse.json({ ok: true, data: { userId: id } });
  } catch (err: any) {
    if (err.code === '23505') { // unique violation
      return NextResponse.json({ ok: false, error: { code: 'CONFLICT', message: 'Email already registered' } }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: { code: 'UNKNOWN', message: 'Server Error' } }, { status: 500 });
  }
}
