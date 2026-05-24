'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/**
 * Zenith signup _page.tsx — rewired from Supabase to LifeOS auth API.
 * ADR-0025: In-place merge from Zenith. Supabase client removed.
 */
export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  function getCsrfToken(): string {
    const match = document.cookie.match(/lifeos_csrf=([^;]+)/)
    return match?.[1] ?? ''
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': getCsrfToken(),
        },
        body: JSON.stringify({ email, password, displayName: name }),
      })

      const json = await res.json() as {
        ok: boolean
        data?: { redirectTo: string }
        error?: { message: string }
      }

      if (!res.ok || !json.ok) {
        setError(json?.error?.message ?? 'Sign-up failed. Please try again.')
        return
      }

      router.replace(json.data?.redirectTo ?? '/app')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">⬡ LifeOS</div>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">
            We sent a verification link to <strong>{email}</strong>.
            Click it to activate your account.
          </p>
          <p className="auth-footer">
            Already verified? <Link href="/signin">Sign in</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⬡ LifeOS</div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Free forever. No credit card required.</p>

        <form onSubmit={handleSubmit} className="auth-form" id="signup-form">
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Your name"
              disabled={loading}
            />
          </div>

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
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              disabled={loading}
            />
          </div>

          <button
            id="signup-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link href="/signin">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
