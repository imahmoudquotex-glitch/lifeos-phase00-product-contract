import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateSession } from '@lifeos/auth';

/**
 * Server-side session guard for use in layout.tsx and page.tsx Server Components.
 * Called in (settings)/layout.tsx — any page under the group is protected automatically.
 *
 * On failure, redirects to /signin (not /auth/signin — our route group is (auth)/signin).
 */
export async function requireSession() {
	const cookieStore = await cookies();
	const sid = cookieStore.get('lifeos_sid')?.value;
	if (!sid) redirect('/signin');
	const session = await validateSession(sid);
	if (!session) redirect('/signin?error=session_invalid');
	return session;
}
