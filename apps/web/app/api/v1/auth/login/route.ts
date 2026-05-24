import { NextRequest, NextResponse } from 'next/server';
import { db } from '@lifeos/db';
import { verifyPassword, createSession, userRepo } from '@lifeos/auth';
import { AppError } from '@lifeos/shared/errors';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) throw new AppError('VALIDATION_FAILED', 'Missing email or password');
    
    const user = await userRepo.findUserByEmailForLogin(email);
    
    if (!user || !user.password_hash) {
      throw new AppError('AUTH_FORBIDDEN', 'Invalid credentials');
    }
    if (user.status !== 'active') {
      throw new AppError('AUTH_FORBIDDEN', 'Account is not active');
    }
    
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new AppError('AUTH_FORBIDDEN', 'Invalid credentials');
    }
    
    const { token, expiresAt } = await createSession(user.id, req.headers.get('user-agent') || undefined, req.headers.get('x-forwarded-for') || undefined);
    
    cookies().set('lifeos_sid', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: Date.parse(expiresAt),
      sameSite: 'lax',
      path: '/'
    });
    
    await userRepo.recordLogin(user.id);
    
    return NextResponse.json({ ok: true, data: { userId: user.id } });
  } catch (err: any) {
    if (err instanceof AppError) {
      return NextResponse.json({ ok: false, error: { code: err.code, message: err.message } }, { status: err.code === 'AUTH_FORBIDDEN' ? 401 : 400 });
    }
    return NextResponse.json({ ok: false, error: { code: 'UNKNOWN', message: 'Server Error' } }, { status: 500 });
  }
}
