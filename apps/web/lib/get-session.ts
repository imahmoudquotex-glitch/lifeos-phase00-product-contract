import { cookies } from 'next/headers';
import { validateSession } from '@lifeos/auth';

export type ServerSession = {
	userId: string;
	workspaceId: string;
	locale: string;
};

/**
 * (3.16) Server-side session retrieval for use in Server Components and route handlers.
 * Returns null if no valid session exists.
 *
 * Usage in Server Component:
 *   const session = await getSession();
 *   if (!session) redirect('/signin');
 */
export async function getSession(): Promise<ServerSession | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get('lifeos_sid')?.value;
	if (!token) return null;

	try {
		const session = await validateSession(token);
		if (!session) return null;
		return {
			userId: session.userId,
			workspaceId: session.workspaceId,
			locale: session.locale ?? 'en',
		};
	} catch {
		return null;
	}
}
