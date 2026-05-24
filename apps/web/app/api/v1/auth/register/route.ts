// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@lifeos/db';
import { hashPassword } from '@lifeos/auth';
import { newUlid } from '@lifeos/shared/ids';
import { AppError } from '@lifeos/shared/errors';

export async function POST(req: NextRequest) {
  try {
    const { email, password, displayName } = await req.json();
    if (!email || !password) throw new AppError('VALIDATION_FAILED', 'Missing email or password');
    
    const id = newUlid();
    const hash = await hashPassword(password);
    
    await db.query(
      `INSERT INTO users (id, email, password_hash, display_name) VALUES ($1, $2, $3, $4)`,
      [id, email.toLowerCase(), hash, displayName || '']
    );
    
    await db.query(
      `INSERT INTO profiles (user_id) VALUES ($1)`,
      [id]
    );
    
    return NextResponse.json({ ok: true, data: { userId: id } });
  } catch (err: any) {
    if (err.code === '23505') { // unique violation
      return NextResponse.json({ ok: false, error: { code: 'CONFLICT', message: 'Email already registered' } }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: { code: 'UNKNOWN', message: 'Server Error' } }, { status: 500 });
  }
}
