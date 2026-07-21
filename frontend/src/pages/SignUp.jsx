import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import OnboardingShell from '../components/OnboardingShell.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignUp() {
  const navigate = useNavigate()
  const { isAuthenticated, isOnboarded, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [focused, setFocused] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isAuthenticated && isOnboarded) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, isOnboarded, navigate])

  const emailValid = EMAIL_RE.test(email.trim())

  async function completeSignUp(withEmail) {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await signUp(withEmail)
      navigate('/onboarding/authorize-github')
    } catch (e) {
      setError(e.message || 'Something went wrong — try again.')
      setSubmitting(false)
    }
  }

  return (
    <OnboardingShell step={1} totalSteps={0}>
      <h1 className="text-center text-2xl font-semibold tracking-tight text-ink">Sign up for iterait</h1>
      <p className="mt-2 text-center text-sm text-ink-2">
        Turn your GitHub commit history into a visual version timeline. Save changes as reusable Actions and
        apply them across projects built in Lovable, Claude, Cursor, or Figma.
      </p>

      <button
        type="button"
        onClick={() => completeSignUp('you@gmail.com')}
        disabled={submitting}
        className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-lg border border-border py-2.5 text-sm font-medium text-ink disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.4 0-13.8 4.2-17 10.3z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.9 39.6 16.4 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2C40.6 36.3 44 30.7 44 24c0-1.3-.1-2.7-.4-3.5z" />
        </svg>
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-ink-3">or sign up with email</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (emailValid) completeSignUp(email.trim()) }}>
        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-2">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="hello@email.com"
            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-ink outline-none transition-colors ${
              focused ? 'border-ink-3' : 'border-border'
            }`}
          />
        </label>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!emailValid || submitting}
          className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {submitting ? 'Continuing…' : 'Continue'}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-ink-3">
        By continuing, you agree to iterait's Terms &amp; Privacy Policy.
      </p>
    </OnboardingShell>
  )
}
