import { NextRequest, NextResponse } from 'next/server';
import { revokeSession } from '@lifeos/auth';
import { cookies } from 'next/headers';

export async function POST(req: any) {
  const token = cookies().get('lifeos_sid')?.value;
  if (token) {
    await revokeSession(token);
    cookies().delete('lifeos_sid');
  }
  return NextResponse.json({ ok: true, data: null });
}
