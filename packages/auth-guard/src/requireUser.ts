import { AppError } from '@lifeos/shared';
import { validateSession } from '@lifeos/auth';

export async function requireUser(req: any): Promise<string> {
  const sid = req.cookies?.get('lifeos_sid')?.value || req.headers?.get('authorization')?.split(' ')[1];
  if (!sid) throw new AppError('AUTH_REQUIRED', 'Sign in required');
  
  const session = await validateSession(sid);
  if (!session) throw new AppError('AUTH_REQUIRED', 'Invalid session');
  
  return session.userId;
}
