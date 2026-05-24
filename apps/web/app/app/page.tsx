import { redirect } from 'next/navigation';
import { getSession } from '../../lib/get-session';
import { SignOutButton } from './sign-out-button';

export default async function AppPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/signin');
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
        <SignOutButton />
      </div>
    </div>
  );
}
