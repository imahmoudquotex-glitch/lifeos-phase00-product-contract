'use client';
import { useState, type FormEvent } from 'react';

type Props = { csrfToken: string };

export function ResetForm({ csrfToken }: Props) {
	const [status, setStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setStatus('submitting');
		setErrorMsg(null);
		const data = new FormData(e.currentTarget);
		try {
			const res = await fetch('/api/v1/auth/reset', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-csrf-token': csrfToken,
				},
				body: JSON.stringify({ email: data.get('email') }),
			});
			if (!res.ok) {
				const json = await res.json() as { error?: { message: string } };
				setStatus('error');
				setErrorMsg(json?.error?.message ?? 'Request failed.');
				return;
			}
			// Always show success to prevent user enumeration
			setStatus('sent');
		} catch {
			setStatus('error');
			setErrorMsg('Network error. Please try again.');
		}
	}

	if (status === 'sent') {
		return (
			<div className="auth-card" role="status">
				<p className="auth-subtitle">
					If an account exists for that email, you'll receive a reset link shortly.
				</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} aria-busy={status === 'submitting'} className="auth-form" id="reset-form">
			{errorMsg && (
				<div className="auth-error" role="alert">
					{errorMsg}
				</div>
			)}
			<div className="form-group">
				<label htmlFor="reset-email">Email</label>
				<input
					id="reset-email"
					name="email"
					type="email"
					required
					autoComplete="email"
					placeholder="you@example.com"
					disabled={status === 'submitting'}
				/>
			</div>
			<button
				id="reset-submit"
				type="submit"
				className="btn-primary"
				disabled={status === 'submitting'}
			>
				{status === 'submitting' ? 'Sending…' : 'Send reset link'}
			</button>
		</form>
	);
}
