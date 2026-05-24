import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Sessions — LifeOS',
};

/**
 * Active sessions management page.
 * Lists all active sessions for the user with device/location info.
 * Revoke individual sessions or all sessions (except current).
 * Session data loaded from DB in Phase 06 via server actions.
 */
export default function SessionsPage() {
	return (
		<div className="settings-page">
			<h1 className="settings-title">Active Sessions</h1>
			<p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
				Manage all devices currently signed in to your account.
			</p>
			{/* Sessions list — wired in Phase 06 */}
			<div className="settings-placeholder" aria-label="Active sessions list — Phase 06">
				<span>📱 Session management · Phase 06</span>
			</div>
		</div>
	);
}
