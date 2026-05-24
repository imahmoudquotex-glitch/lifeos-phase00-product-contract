import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: {
		template: '%s — LifeOS',
		default: 'Auth — LifeOS',
	},
};

/**
 * Public auth layout (no session required).
 * Routes: /signin, /signup, /reset
 * D-078: Settings layout uses requireSession — this layout does NOT.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div className="auth-shell">
			{children}
		</div>
	);
}
