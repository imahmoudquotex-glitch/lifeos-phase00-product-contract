'use client';
import { useRouter, usePathname } from 'next/navigation';

type Props = {
	currentLocale: string;
	csrfToken: string;
};

const LOCALES = [
	{ value: 'ar', label: 'العربية', dir: 'rtl' },
	{ value: 'en', label: 'English', dir: 'ltr' },
] as const;

/**
 * Locale switcher — sends PATCH to /api/v1/me to persist locale preference.
 * ADR-0028: locale stored in users.locale column (migration 0200).
 */
export function LocaleSwitcher({ currentLocale, csrfToken }: Props) {
	const router = useRouter();
	const pathname = usePathname();

	async function handleChange(locale: string) {
		await fetch('/api/v1/me', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				'x-csrf-token': csrfToken,
			},
			body: JSON.stringify({ locale }),
		});
		// Reload the page to apply the new locale
		router.replace(pathname ?? '/');
		router.refresh();
	}

	return (
		<div className="locale-switcher" aria-label="Language selector">
			{LOCALES.map((loc) => (
				<button
					key={loc.value}
					type="button"
					lang={loc.value}
					dir={loc.dir}
					aria-pressed={currentLocale === loc.value}
					aria-current={currentLocale === loc.value ? 'true' : undefined}
					onClick={() => void handleChange(loc.value)}
					style={{
						padding: '4px 12px',
						borderRadius: '6px',
						background: currentLocale === loc.value ? 'var(--accent-purple)' : 'var(--bg-elevated)',
						color: 'var(--text-primary)',
						border: '1px solid var(--border-default)',
						cursor: 'pointer',
						fontWeight: currentLocale === loc.value ? 600 : 400,
						transition: 'background 150ms ease',
					}}
				>
					{loc.label}
				</button>
			))}
		</div>
	);
}
