'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordStrength } from './password-strength';

type Props = { csrfToken: string };

/**
 * Sign-in form component.
 * ADR-0027: sends x-csrf-token header (consumed by withCsrfProtection HOC).
 * D-075: uses onSubmit + e.preventDefault() — NOT form action.
 * D-076: uses useRouter().replace() — NOT window.location.href.
 */
export function SigninForm({ csrfToken }: Props) {
	const router = useRouter();
	const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
	const [errorMsg, setErrorMsg] = useState<string | null>(null);
	const [password, setPassword] = useState('');

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setStatus('submitting');
		setErrorMsg(null);
		const data = new FormData(e.currentTarget);
		try {
			const res = await fetch('/api/v1/auth/signin', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-csrf-token': csrfToken,
				},
				body: JSON.stringify({
					email: data.get('email'),
					password: data.get('password'),
				}),
			});
			const json = await res.json() as { ok: boolean; data?: { redirectTo: string; locale: string }; error?: { message: string } };
			if (!res.ok || !json.ok) {
				setStatus('error');
				setErrorMsg(json?.error?.message ?? 'Sign-in failed. Check credentials.');
				return;
			}
			router.replace(json.data?.redirectTo ?? '/app');
		} catch {
			setStatus('error');
			setErrorMsg('Network error. Please try again.');
		}
	}

	return (
		<form onSubmit={handleSubmit} aria-busy={status === 'submitting'} className="auth-form" id="signin-form">
			{errorMsg && (
				<div className="auth-error" role="alert">
					{errorMsg}
				</div>
			)}
			<div className="form-group">
				<label htmlFor="signin-email">Email</label>
				<input
					id="signin-email"
					name="email"
					type="email"
					required
					autoComplete="email"
					placeholder="you@example.com"
					disabled={status === 'submitting'}
				/>
			</div>
			<div className="form-group">
				<label htmlFor="signin-password">Password</label>
				<input
					id="signin-password"
					name="password"
					type="password"
					required
					autoComplete="current-password"
					placeholder="••••••••"
					disabled={status === 'submitting'}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
			</div>
			<PasswordStrength password={password} />
			<button
				id="signin-submit"
				type="submit"
				className="btn-primary"
				disabled={status === 'submitting'}
			>
				{status === 'submitting' ? 'Signing in…' : 'Sign in'}
			</button>
		</form>
	);
}
