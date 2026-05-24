'use client';
import { useEffect, useRef } from 'react';

type Props = {
	siteKey: string;          // Cloudflare Turnstile site key from ServerEnv
	onToken: (token: string) => void;
	onError?: () => void;
};

declare global {
	interface Window {
		turnstile?: {
			render: (el: HTMLElement, cfg: {
				sitekey: string;
				callback: (token: string) => void;
				'error-callback': () => void;
			}) => void;
		};
	}
}

/**
 * Cloudflare Turnstile captcha widget.
 * D-079: Chosen for privacy (no Google) + free tier + no UX friction.
 * Server verification: POST to /api/v1/auth/signin passes token → TURNSTILE_SECRET checks it.
 */
export function Captcha({ siteKey, onToken, onError }: Props) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const script = document.createElement('script');
		script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
		script.async = true;
		script.defer = true;
		document.head.appendChild(script);

		const handle = setInterval(() => {
			const w = window.turnstile;
			if (!w || !ref.current) return;
			clearInterval(handle);
			w.render(ref.current, {
				sitekey: siteKey,
				callback: (token: string) => onToken(token),
				'error-callback': () => onError?.(),
			});
		}, 100);

		return () => {
			clearInterval(handle);
			if (document.head.contains(script)) {
				document.head.removeChild(script);
			}
		};
	}, [siteKey, onToken, onError]);

	return <div ref={ref} data-testid="turnstile-widget" />;
}
