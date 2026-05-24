import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { validateSession } from '@lifeos/auth';
import { db } from '@lifeos/db';
import { LocaleSwitcher } from '@lifeos/auth-ui';

export const metadata: Metadata = {
	title: 'Language Settings — LifeOS',
};

/**
 * Locale / Language settings page.
 * ADR-0028: user.locale column (migration 0200) — ar or en.
 * Shows current locale and lets user switch.
 */
export default async function LocalePage() {
	const cookieStore = await cookies();
	const sid = cookieStore.get('lifeos_sid')?.value ?? '';
	const session = await validateSession(sid);
	const csrfToken = cookieStore.get('lifeos_csrf')?.value ?? '';

	// Fetch current locale
	const user = session
		? await db.oneOrNone<{ locale: string }>(
				`SELECT locale FROM users WHERE id = $1`,
				[session.userId],
			)
		: null;

	const currentLocale = user?.locale ?? 'en';

	return (
		<div className="settings-page">
			<h1 className="settings-title">Language</h1>
			<p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
				Choose your preferred language. UI and emails will use this setting.
			</p>
			<LocaleSwitcher currentLocale={currentLocale} csrfToken={csrfToken} />
			<p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '16px' }}>
				Supported: Arabic (العربية), English
			</p>
		</div>
	);
}
