'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Zenith sign-in page — rewired from Supabase to LifeOS auth API.
 * ADR-0025: Zenith UI in-place merge. Supabase client removed.
 * D-075: onSubmit + e.preventDefault() — NOT form action.
 * D-076: useRouter().replace() — NOT window.location.href.
 * ADR-0027: x-csrf-token header sent (consumed by withCsrfProtection HOC).
 */
export default function SignInPage() {
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') ?? '/app'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch CSRF token from cookie (set by middleware)
  function getCsrfToken(): string {
    const match = document.cookie.match(/lifeos_csrf=([^;]+)/)
    return match?.[1] ?? ''
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/v1/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({ email, password }),
      })

      const json = await res.json() as {
        ok: boolean
        data?: { redirectTo: string; locale: string }
        error?: { message: string }
      }

      if (!res.ok || !json.ok) {
        setError(json?.error?.message ?? 'Sign-in failed. Check your credentials.')
        return
      }

      router.replace(json.data?.redirectTo ?? redirect)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⬡ LifeOS</div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your workspace</p>

        <form onSubmit={handleSubmit} className="auth-form" id="signin-form">
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <p style={{ textAlign: 'right', marginBottom: '8px' }}>
            <Link href="/auth/reset" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Forgot password?
            </Link>
          </p>

          <button
            id="signin-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          No account?{' '}
          <Link href="/auth/signup">Create one free</Link>
        </p>
      </div>
    </div>
  )
}
