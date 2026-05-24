// @ts-nocheck
import { AppError } from '@lifeos/shared/errors';
import { db } from '@lifeos/db';

/**
 * Validates generic business rules for invitations.
 */
export async function validateInvitation(email: string, role: string) {
  if (!email || !email.includes('@')) {
    throw new AppError('VALIDATION_FAILED', 'Invalid email');
  }
  if (!['admin', 'member', 'viewer'].includes(role)) {
    throw new AppError('VALIDATION_FAILED', 'Invalid role for invitation');
  }
}
