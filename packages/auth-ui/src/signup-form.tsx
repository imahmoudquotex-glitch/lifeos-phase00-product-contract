'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type Props = { csrfToken: string };

export function SignupForm({ csrfToken }: Props) {
	const router = useRouter();
	const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setStatus('submitting');
		setErrorMsg(null);
		const data = new FormData(e.currentTarget);
		try {
			const res = await fetch('/api/v1/auth/signup', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-csrf-token': csrfToken,
				},
				body: JSON.stringify({
					email: data.get('email'),
					password: data.get('password'),
					displayName: data.get('displayName'),
					locale: data.get('locale') ?? 'en',
				}),
			});
			const json = await res.json() as { ok: boolean; data?: { redirectTo: string }; error?: { message: string } };
			if (!res.ok || !json.ok) {
				setStatus('error');
				setErrorMsg(json?.error?.message ?? 'Sign-up failed. Please try again.');
				return;
			}
			router.replace(json.data?.redirectTo ?? '/app');
		} catch {
			setStatus('error');
			setErrorMsg('Network error. Please try again.');
		}
	}

	return (
		<form onSubmit={handleSubmit} aria-busy={status === 'submitting'} className="auth-form" id="signup-form">
			{errorMsg && (
				<div className="auth-error" role="alert">
					{errorMsg}
				</div>
			)}
			<div className="form-group">
				<label htmlFor="signup-name">Display Name</label>
				<input
					id="signup-name"
					name="displayName"
					type="text"
					required
					autoComplete="name"
					placeholder="Your name"
					disabled={status === 'submitting'}
				/>
			</div>
			<div className="form-group">
				<label htmlFor="signup-email">Email</label>
				<input
					id="signup-email"
					name="email"
					type="email"
					required
					autoComplete="email"
					placeholder="you@example.com"
					disabled={status === 'submitting'}
				/>
			</div>
			<div className="form-group">
				<label htmlFor="signup-password">Password</label>
				<input
					id="signup-password"
					name="password"
					type="password"
					required
					autoComplete="new-password"
					placeholder="••••••••"
					minLength={8}
					disabled={status === 'submitting'}
				/>
			</div>
			<button
				id="signup-submit"
				type="submit"
				className="btn-primary"
				disabled={status === 'submitting'}
			>
				{status === 'submitting' ? 'Creating account…' : 'Create account'}
			</button>
		</form>
	);
}
