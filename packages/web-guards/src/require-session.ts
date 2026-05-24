import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateSession } from '@lifeos/auth';
import { getDb } from '@lifeos/db';
import { getServerEnv } from '@lifeos/shared/env';

/**
 * Server-side session guard for use in layout.tsx and page.tsx Server Components.
 * Called in (settings)/layout.tsx — any page under the group is protected automatically.
 *
 * On failure, redirects to /signin (not /auth/signin — our route group is (auth)/signin).
 */
export async function requireSession() {
  const env = getServerEnv();
  const cookieStore = await cookies();
  const sid = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;
  if (!sid) redirect('/signin');

  const dbClient = getDb(env.DATABASE_URL);
  const session = await validateSession(dbClient, sid);
  if (!session) redirect('/signin?error=session_invalid');
  
  return {
    ...session,
    workspaceId: session.workspaceId ?? null,
  };
}
