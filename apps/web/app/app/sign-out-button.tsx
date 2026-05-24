'use client';

import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await fetch('/api/v1/auth/signout', { method: 'POST' });
    router.replace('/signin');
  }

  return (
    <button
      onClick={signOut}
      style={{
        padding: '10px 24px',
        background: 'rgba(255,255,255,.06)',
        border: '1px solid rgba(255,255,255,.1)',
        borderRadius: 10, color: '#fafafa',
        cursor: 'pointer', fontSize: '.9rem',
      }}
    >
      تسجيل الخروج
    </button>
  );
}
