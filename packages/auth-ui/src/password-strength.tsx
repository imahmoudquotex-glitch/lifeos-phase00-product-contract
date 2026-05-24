'use client';

const RULES = [
	{ test: (p: string) => p.length >= 8, label: '8+ chars' },
	{ test: (p: string) => /[A-Z]/.test(p), label: 'Uppercase' },
	{ test: (p: string) => /[a-z]/.test(p), label: 'Lowercase' },
	{ test: (p: string) => /[0-9]/.test(p), label: 'Number' },
	{ test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Symbol' },
];

// Using CSS custom properties to avoid tailwind dark-mode drift (ADR-0030)
const WIDTHS = ['0%', '20%', '40%', '60%', '80%', '100%'];
const COLORS = ['transparent', '#ef4444', '#f97316', '#eab308', '#4ade80', '#10b981'];

export function PasswordStrength({ password }: { password: string }) {
	const passed = RULES.filter(r => r.test(password)).length;
	return (
		<div className="space-y-1" aria-live="polite">
			<div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
				<div
					aria-hidden
					style={{
						height: '100%',
						width: WIDTHS[passed] ?? '0%',
						background: COLORS[passed] ?? 'transparent',
						borderRadius: '2px',
						transition: 'width 200ms ease, background 200ms ease',
					}}
				/>
			</div>
			<p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{passed}/5 requirements met</p>
		</div>
	);
}
