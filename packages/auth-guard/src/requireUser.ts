// @ts-nocheck
import { AppError } from '@lifeos/shared';
export function requireUser(userId: string | null): void {
  if (!userId) throw new AppError('AUTH_REQUIRED', 'Sign in required');
}
