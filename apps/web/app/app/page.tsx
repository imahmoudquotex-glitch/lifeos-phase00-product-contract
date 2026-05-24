'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function AppPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/signin');
      } else {
        window.location.href = 'http://localhost:8081/dashboard';
      }
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/signin');
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', 'Cairo', system-ui, sans-serif",
      color: '#fafafa',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64,
          background: 'linear-gradient(135deg, #7c3aed, #4ade80)',
          borderRadius: 18, margin: '0 auto 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
        }}>⬡</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8, letterSpacing: '-.03em' }}>
          مرحباً بك في LifeOS 🎉
        </h1>
        <p style={{ color: '#71717a', marginBottom: 32 }}>
          تسجيل الدخول نجح — قريباً هيجي الـ dashboard الكامل
        </p>
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
      </div>
    </div>
  );
}
