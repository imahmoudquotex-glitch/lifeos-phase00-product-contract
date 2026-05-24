'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

// ─── Majestic Gravitational Black Hole & Slower Spiraling Emerald Stars ───
function MajesticBlackHoleStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    let centerX = width / 2;
    let centerY = height / 2;

    const stars: {
      angle: number;
      distance: number;
      r: number;
      speed: number;
      color: string;
    }[] = [];
    
    const numStars = 140;

    for (let i = 0; i < numStars; i++) {
      const distance = Math.random() * (Math.max(width, height) * 0.75) + 50;
      stars.push({
        angle: Math.random() * Math.PI * 2,
        distance: distance,
        r: Math.random() * 1.3 + 0.3,
        speed: (0.0012 + Math.random() * 0.002) * (160 / distance),
        color: Math.random() > 0.4 ? 'rgba(34, 197, 94, ' : 'rgba(16, 185, 129, '
      });
    }

    let animationFrameId: number;
    let diskAngle = 0;

    const draw = () => {
      ctx.fillStyle = '#010101';
      ctx.fillRect(0, 0, width, height);

      diskAngle += 0.0015;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-diskAngle * 0.5);
      const outerGlow = ctx.createRadialGradient(0, 0, 40, 0, 0, 380);
      outerGlow.addColorStop(0, 'rgba(0, 0, 0, 0)');
      outerGlow.addColorStop(0.1, 'rgba(34, 197, 94, 0.12)');
      outerGlow.addColorStop(0.4, 'rgba(16, 185, 129, 0.05)');
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 400, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(Math.PI / 12);
      
      const lensGrad = ctx.createLinearGradient(-150, 0, 150, 0);
      lensGrad.addColorStop(0, 'rgba(34, 197, 94, 0.05)');
      lensGrad.addColorStop(0.3, 'rgba(34, 197, 94, 0.4)');
      lensGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.6)');
      lensGrad.addColorStop(0.7, 'rgba(34, 197, 94, 0.4)');
      lensGrad.addColorStop(1, 'rgba(34, 197, 94, 0.05)');
      
      ctx.strokeStyle = lensGrad;
      ctx.lineWidth = 4;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 15;
      
      ctx.beginPath();
      ctx.ellipse(0, 0, 140, 30, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      ctx.save();
      ctx.translate(centerX - 10, centerY - 5);
      const beamingGlow = ctx.createRadialGradient(0, 0, 20, 0, 0, 180);
      beamingGlow.addColorStop(0, 'rgba(52, 211, 153, 0.25)');
      beamingGlow.addColorStop(0.6, 'rgba(16, 185, 129, 0.08)');
      beamingGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = beamingGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 200, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 52, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 35;
      ctx.fill();
      ctx.shadowBlur = 0;

      for (let i = 0; i < numStars; i++) {
        const star = stars[i];
        if (!star) continue;

        star.distance -= 0.15 + (12 / star.distance); 
        star.angle += star.speed;

        if (star.distance <= 54) {
          star.distance = Math.random() * (Math.max(width, height) * 0.7) + 250;
          star.angle = Math.random() * Math.PI * 2;
          star.speed = (0.0012 + Math.random() * 0.002) * (160 / star.distance);
        }

        const x = centerX + Math.cos(star.angle) * star.distance;
        const y = centerY + Math.sin(star.angle) * star.distance;

        let brightness = 1.0;
        if (star.distance < 110) {
          brightness = (star.distance - 54) / 56;
        }

        ctx.beginPath();
        ctx.arc(x, y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${Math.max(0, Math.min(brightness, 0.85))})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      centerX = width / 2;
      centerY = height / 2;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();
  const cardRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Spotlight Effect
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    };

    card.addEventListener('mousemove', handleMouseMove);
    return () => card.removeEventListener('mousemove', handleMouseMove);
  }, []);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = 'http://localhost:8081/dashboard';
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError('✅ تم تسجيل الحساب بنجاح! تحقق من بريدك الإلكتروني.');
      }
    } catch (err: any) {
      setError(err.message ?? 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: 'google' | 'github') {
    setOauthLoading(provider);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#010101',
      padding: '4rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      direction: 'rtl'
    }}>
      {/* الثقب الأسود الكوني */}
      <MajesticBlackHoleStarfield />

      {/* فقاعات إضاءة دائرية نيون تحت صفحة تسجيل الدخول */}
      <div className="glow-orb orb-1" />
      <div className="glow-orb orb-2" />
      <div className="glow-orb orb-3" />
      <div className="glow-orb orb-4" />

      {/* الكارت الزجاجي الأسطوري الممتد */}
      <div
        ref={cardRef}
        className="glass-card-premium"
        style={{
          width: '100%',
          maxWidth: 450,
          minHeight: 780,
          background: 'rgba(255, 255, 255, 0.015)',
          backdropFilter: 'blur(55px)',
          WebkitBackdropFilter: 'blur(55px)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: 32,
          padding: '7.5rem 3.2rem',
          boxShadow: '0 50px 130px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          position: 'relative',
          zIndex: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Spotlight Effect inside card */}
        <div className="spotlight" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(600px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(34, 197, 94, 0.08), transparent 45%)',
          zIndex: -1,
          pointerEvents: 'none'
        }} />

        {/* خط نيون علوي فائق الدقة والأناقة */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1.5,
          background: 'linear-gradient(to right, transparent, rgba(34, 197, 94, 0.4), transparent)'
        }} />

        {/* ─── الهيدر واللوجو ─── */}
        <div style={{ textAlign: 'center' }}>
          <h1 className="pro-logo" style={{ 
            fontSize: '2.1rem', 
            fontWeight: 900, 
            color: '#ffffff', 
            letterSpacing: '0.24em', 
            margin: 0,
            textTransform: 'uppercase',
            fontFamily: "'Inter', sans-serif",
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            ZENITH
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#636366', marginTop: 12, fontWeight: 400, fontFamily: "var(--font-tajawal), sans-serif" }}>
            مسار التحكم والنفاذ الآمن للنظام الفائق
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 14px',
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.12)',
            borderRadius: 10, color: '#f87171',
            fontSize: '0.85rem', textAlign: 'center',
            borderRight: '3px solid #ef4444',
            fontFamily: "var(--font-tajawal), sans-serif"
          }}>
            {error}
          </div>
        )}

        {/* ─── أزرار الدخول السريعة جنبًا إلى جنب بالإنجليزية ─── */}
        <div className="oauth-capsule" style={{ 
          display: 'flex', 
          alignItems: 'center',
          width: '100%', 
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: 16,
          padding: '2px',
          overflow: 'hidden'
        }}>
          {/* زر Google */}
          <button
            onClick={() => handleOAuth('google')}
            disabled={!!oauthLoading || loading}
            className="premium-oauth-btn-side"
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '14px 16px',
              background: 'transparent',
              border: 'none',
              borderRadius: 14, color: '#ffffff', 
              fontSize: '0.95rem', fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              cursor: oauthLoading || loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {oauthLoading === 'google' ? (
              <span className="spinner" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Google
          </button>

          {/* خط عمودي فخم يفصل بين الزرين */}
          <div style={{
            width: 1,
            height: 24,
            background: 'linear-gradient(to bottom, transparent, rgba(34, 197, 94, 0.4), transparent)'
          }} />

          {/* زر GitHub */}
          <button
            onClick={() => handleOAuth('github')}
            disabled={!!oauthLoading || loading}
            className="premium-oauth-btn-side"
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '14px 16px',
              background: 'transparent',
              border: 'none',
              borderRadius: 14, color: '#ffffff', 
              fontSize: '0.95rem', fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              cursor: oauthLoading || loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {oauthLoading === 'github' ? (
              <span className="spinner" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            )}
            GitHub
          </button>
        </div>

        {/* فاصل البريد الإلكتروني الأنيق */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.06))' }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#48484a', letterSpacing: '0.05em', fontFamily: "var(--font-tajawal), sans-serif" }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            أو من خلال البريد
          </span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.06))' }} />
        </div>

        {/* ─── نموذج الإدخال ذو الحقول المنحنية الفاخرة ─── */}
        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div className="input-field-container">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="البريد الإلكتروني"
              disabled={loading}
              className="glass-pro-input-rounded"
              style={{ fontFamily: "var(--font-tajawal), sans-serif" }}
            />
          </div>

          <div className="input-field-container">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="كلمة المرور"
              disabled={loading}
              className="glass-pro-input-rounded"
              style={{ fontFamily: "var(--font-tajawal), sans-serif" }}
            />
          </div>

          {/* زر دخول أخضر غامق فاخر ومدرج جداً */}
          <button
            type="submit"
            disabled={loading || !!oauthLoading}
            className="premium-submit-btn"
            style={{
              width: '100%', padding: '16px', marginTop: 12,
              background: 'linear-gradient(135deg, #065f46 0%, #064e3b 100%)',
              border: 'none', borderRadius: 16,
              color: '#ffffff', fontSize: '0.98rem', fontWeight: 700,
              cursor: loading || oauthLoading ? 'not-allowed' : 'pointer',
              fontFamily: "var(--font-tajawal), sans-serif",
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 8px 30px rgba(6, 95, 70, 0.35)',
            }}
          >
            {loading ? (
              <span className="spinner-white" />
            ) : (
              mode === 'signin' ? 'تسجيل الدخول للنظام' : 'إنشاء حساب جديد'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.88rem', color: '#52525b', fontFamily: "var(--font-tajawal), sans-serif" }}>
          {mode === 'signin' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}{' '}
          <button
            onClick={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); }}
            style={{ 
              background: 'none', border: 'none', color: '#22c55e', 
              fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem',
              padding: 0, transition: 'color 0.2s ease',
              fontFamily: "var(--font-tajawal), sans-serif"
            }}
            onMouseEnter={e => (e.target as HTMLButtonElement).style.color = '#4ade80'}
            onMouseLeave={e => (e.target as HTMLButtonElement).style.color = '#22c55e'}
          >
            {mode === 'signin' ? 'سجل مجاناً' : 'سجل الدخول'}
          </button>
        </p>
      </div>

      {/* استخدام dangerouslySetInnerHTML يمنع خطأ الـ React Hydration Mismatch تماماً وينهيه */}
      <style dangerouslySetInnerHTML={{ __html: `
        body {
          font-family: var(--font-tajawal), var(--font-geist-sans), 'Cairo', system-ui, -apple-system, sans-serif !important;
        }

        /* ─── بقع الإضاءة والفقاعات الدائرية تحت صفحة تسجيل الدخول (Floating Glow Orbs) ─── */
        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          z-index: 0;
          pointer-events: none;
        }
        .orb-1 {
          top: -10%;
          left: -10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(0,0,0,0) 70%);
          animation: floatOrb 15s infinite alternate ease-in-out;
        }
        .orb-2 {
          bottom: -15%;
          right: -10%;
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, rgba(6, 95, 70, 0.16) 0%, rgba(0,0,0,0) 70%);
          animation: floatOrb 20s infinite alternate-reverse ease-in-out;
        }
        .orb-3 {
          bottom: -20%;
          left: -5%;
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.12) 0%, rgba(0,0,0,0) 70%);
          animation: floatOrb 12s infinite alternate ease-in-out;
        }
        .orb-4 {
          top: 30%;
          right: -15%;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(4, 120, 87, 0.06) 0%, rgba(0,0,0,0) 70%);
          animation: floatOrb 18s infinite alternate-reverse ease-in-out;
        }

        @keyframes floatOrb {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-30px) scale(1.15); }
        }

        /* تفاعل اللوجو عند وضع الماوس عليه */
        .pro-logo:hover {
          letter-spacing: 0.32em !important;
          text-shadow: 0 0 15px rgba(34, 197, 94, 0.45);
        }

        /* الكارت الزجاجي الفاخر */
        .glass-card-premium:hover {
          border-color: rgba(34, 197, 94, 0.22);
          box-shadow: 0 60px 130px rgba(0, 0, 0, 0.95), 0 0 50px rgba(34, 197, 94, 0.08);
        }

        /* أزرار الدخول التفاعلية الشفافة جنبًا إلى جنب داخل الكبسولة */
        .premium-oauth-btn-side:hover {
          background: rgba(34, 197, 94, 0.06) !important;
          color: #22c55e !important;
          box-shadow: inset 0 0 15px rgba(34, 197, 94, 0.05);
        }

        /* حقول الإدخال فائقة التفاعل مع حواف دائرية فخمة */
        .input-field-container {
          position: relative;
          width: 100%;
        }
        .glass-pro-input-rounded {
          width: 100%;
          padding: 16px 22px;
          background: rgba(255, 255, 255, 0.015) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          border-radius: 20px;
          color: #ffffff;
          font-size: 0.98rem;
          outline: none;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glass-pro-input-rounded::placeholder {
          color: #52525b;
          opacity: 0.7;
        }
        .glass-pro-input-rounded:hover {
          border-color: rgba(255, 255, 255, 0.12) !important;
          background: rgba(255, 255, 255, 0.02) !important;
        }
        .glass-pro-input-rounded:focus {
          border-color: rgba(34, 197, 94, 0.6) !important;
          background: rgba(255, 255, 255, 0.03) !important;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15) !important;
        }

        /* زر الإرسال الرئيسي اللامع الأخضر الغامق الفاخر */
        .premium-submit-btn:hover {
          background: linear-gradient(135deg, #047857 0%, #065f46 100%) !important;
          box-shadow: 0 12px 35px rgba(6, 95, 70, 0.5) !important;
          transform: translateY(-2px);
        }
        .premium-submit-btn:active {
          transform: translateY(0);
        }

        .spinner {
          width: 14px; height: 14px; 
          border: 2px solid rgba(16,185,129,0.2); 
          border-top-color: #22c55e; 
          border-radius: 50%; 
          display: inline-block; 
          animation: spin 0.8s linear infinite;
        }

        .spinner-white {
          width: 14px; height: 14px; 
          border: 2px solid rgba(255,255,255,0.2); 
          border-top-color: #fff; 
          border-radius: 50%; 
          display: inline-block; 
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        ::selection { background: rgba(34, 197, 94, 0.3); color: #fff; }
      ` }} />
    </div>
  );
}
