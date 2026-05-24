import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Security Settings — LifeOS',
};

/**
 * Security settings page.
 * Shows: password change, active sessions count, 2FA status (Phase 06+).
 * Session is guaranteed by (settings)/layout.tsx via requireSession().
 */
export default function SecurityPage() {
	return (
		<div className="settings-page">
			<h1 className="settings-title">Security</h1>
			<section className="settings-section">
				<h2>Password</h2>
				<p style={{ color: 'var(--text-secondary)' }}>
					Change your password below. You will stay signed in on this device.
				</p>
				{/* Password change form — wired in Phase 06 */}
				<div className="settings-placeholder" aria-label="Password change form — Phase 06">
					<span>🔑 Password change · Phase 06</span>
				</div>
			</section>
			<section className="settings-section">
				<h2>Two-Factor Authentication</h2>
				<p style={{ color: 'var(--text-secondary)' }}>
					2FA support via TOTP — coming in Phase 07.
				</p>
			</section>
		</div>
	);
}
