'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export type SessionUser = {
	userId: string;
	workspaceId: string;
	locale: 'ar' | 'en';
};

type UseSessionResult =
	| { status: 'loading' }
	| { status: 'unauthenticated' }
	| { status: 'authenticated'; user: SessionUser };

/**
 * (3.14) Client-side session hook.
 * Fetches /api/v1/me and caches the result.
 * On 401 → redirects to /signin.
 * ADR-0028: locale returned from session for LocaleSwitcher.
 */
export function useSession(): UseSessionResult {
	const [result, setResult] = useState<UseSessionResult>({ status: 'loading' });
	const router = useRouter();

	const refresh = useCallback(async () => {
		try {
			const res = await fetch('/api/v1/me', { credentials: 'same-origin' });
			if (res.status === 401) {
				setResult({ status: 'unauthenticated' });
				router.replace('/signin');
				return;
			}
			const json = await res.json() as { ok: boolean; data?: SessionUser };
			if (json.ok && json.data) {
				setResult({ status: 'authenticated', user: json.data });
			} else {
				setResult({ status: 'unauthenticated' });
			}
		} catch {
			setResult({ status: 'unauthenticated' });
		}
	}, [router]);

	useEffect(() => { void refresh(); }, [refresh]);

	return result;
}
