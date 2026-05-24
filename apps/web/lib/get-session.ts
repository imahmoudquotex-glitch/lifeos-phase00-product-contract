import { cookies } from 'next/headers';
import { validateSession } from '@lifeos/auth';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';

export type ServerSession = {
  userId: string;
  workspaceId: string | null;
  locale: string;
};

/**
 * Server-side session retrieval for use in Server Components and route handlers.
 * Returns null if no valid session exists.
 * Reads SESSION_COOKIE_NAME from env (not hardcoded).
 *
 * Usage in Server Component:
 *   const session = await getSession();
 *   if (!session) redirect('/signin');
 */
export async function getSession(): Promise<ServerSession | null> {
  try {
    const env = getServerEnv();
    const cookieStore = await cookies();
    const token = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const dbClient = getDb(env.DATABASE_URL);
    const session = await validateSession(dbClient, token);
    if (!session) return null;

    return {
      userId: session.userId,
      workspaceId: session.workspaceId ?? null,
      locale: session.locale ?? 'en',
    };
  } catch {
    return null;
  }
}
