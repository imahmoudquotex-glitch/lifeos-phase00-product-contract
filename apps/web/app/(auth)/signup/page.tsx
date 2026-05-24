'use client';
import { useRouter } from 'next/navigation';
import { SignupForm } from '@lifeos/auth-ui';
import Link from 'next/link';

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/lifeos_csrf=([^;]+)/);
  return match?.[1] ?? '';
}

export default function SignupPage() {
  const csrfToken = getCsrfToken();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⬡ LifeOS</div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start your LifeOS journey — free, private, powerful.</p>
        <SignupForm csrfToken={csrfToken} />
        <p className="auth-footer">
          Already have an account?{' '}
          <Link href="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
