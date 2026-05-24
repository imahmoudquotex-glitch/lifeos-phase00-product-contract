'use client';
import Link from 'next/link';
import { ResetForm } from '@lifeos/auth-ui';

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/lifeos_csrf=([^;]+)/);
  return match?.[1] ?? '';
}

export default function ResetPage() {
  const csrfToken = getCsrfToken();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⬡ LifeOS</div>
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Enter your email to receive a reset link.</p>
        <ResetForm csrfToken={csrfToken} />
        <p className="auth-footer">
          Remembered it?{' '}
          <Link href="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
