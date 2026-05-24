import type { ReactNode } from 'react';
import { requireSession } from '@lifeos/web-guards';

/**
 * Settings route group layout — auth-guarded.
 * D-078: requireSession() is called HERE, not in each individual page.
 * Any page under app/(settings)/** is automatically protected.
 */
export default async function SettingsLayout({ children }: { children: ReactNode }) {
	await requireSession();  // Redirects to /signin if no valid session
	return (
		<div className="settings-shell">
			<nav className="settings-nav" aria-label="Settings navigation">
				<a href="/settings/security">Security</a>
				<a href="/settings/sessions">Sessions</a>
				<a href="/settings/locale">Language</a>
			</nav>
			<main className="settings-content">
				{children}
			</main>
		</div>
	);
}
