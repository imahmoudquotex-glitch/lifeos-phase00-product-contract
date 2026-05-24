'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { newUlid } from '@lifeos/shared'

export default function OnboardingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/v1/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': newUlid(),
        },
        body: JSON.stringify({ name }),
      })

      const json = await res.json() as { ok: boolean; data?: { slug: string }; error?: { message: string } }

      if (!json.ok) {
        setError(json.error?.message ?? 'Failed to create workspace')
        return
      }

      router.push(`/app/${json.data!.slug}`)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⬡ Zenith</div>
        <h1 className="auth-title">Create your workspace</h1>
        <p className="auth-subtitle">A workspace is where your team collaborates.</p>

        <form onSubmit={handleSubmit} className="auth-form" id="create-workspace-form">
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="workspace-name">Workspace name</label>
            <input
              id="workspace-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={64}
              placeholder="My Team"
              disabled={loading}
            />
          </div>

          <button
            id="create-workspace-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create workspace'}
          </button>
        </form>
      </div>
    </div>
  )
}
