import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import OnboardingShell from '../../components/OnboardingShell'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function inputStyle(focused) {
  return {
    width: '100%',
    border: `1.5px solid ${focused ? '#aaa' : '#e8e8e8'}`,
    borderRadius: '10px',
    padding: '11px 13px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    color: '#111',
    background: '#fff',
    boxSizing: 'border-box',
    transition: 'border-color .15s',
  }
}

function Label({ children }) {
  return <div style={{ fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '8px' }}>{children}</div>
}

export default function SignUp() {
  const navigate = useNavigate()
  const { isAuthenticated, isOnboarded, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [focusedField, setFocused] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated && isOnboarded) navigate('/', { replace: true })
  }, [isAuthenticated, isOnboarded, navigate])

  const emailValid = EMAIL_RE.test(email.trim())

  function completeSignUp() {
    setSubmitting(true)
    signUp(email.trim())
    navigate('/onboarding/authorize-github')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!emailValid || submitting) return
    completeSignUp()
  }

  function handleGoogle() {
    if (submitting) return
    setSubmitting(true)
    signUp('you@gmail.com', 'Google User')
    navigate('/onboarding/authorize-github')
  }

  return (
    <OnboardingShell step={1} totalSteps={0}>
      <h1 style={{ fontSize: '26px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', marginBottom: '8px' }}>
        Sign up for iterait
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.5, marginBottom: '28px' }}>
        One login across all your vibe coding tools — Loveable, Figma Make, Claude, Cursor and Stitch all in one place. Your files, your versions, your actions.
      </p>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={submitting}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '11px',
          border: '1.5px solid #e8e8e8',
          borderRadius: '10px',
          background: '#fff',
          fontSize: '14px',
          fontWeight: 500,
          color: '#333',
          cursor: submitting ? 'default' : 'pointer',
          marginBottom: '20px',
        }}>
        <svg width="16" height="16" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4c-7.4 0-13.8 4.2-17 10.3z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.9 39.6 16.4 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2C40.6 36.3 44 30.7 44 24c0-1.3-.1-2.7-.4-3.5z"/>
        </svg>
        Continue with Google
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0 20px' }}>
        <div style={{ flex: 1, height: '1px', background: '#ececea' }} />
        <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>or sign up with email</span>
        <div style={{ flex: 1, height: '1px', background: '#ececea' }} />
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <Label>Email</Label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            placeholder="hello@email.com"
            style={inputStyle(focusedField === 'email')}
          />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '13px', color: 'var(--text-3)' }}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => emailValid && completeSignUp()}
            disabled={!emailValid}
            style={{ background: 'none', border: 'none', padding: 0, fontSize: '13px', color: emailValid ? 'var(--text)' : 'var(--text-4)', textDecoration: 'underline', cursor: emailValid ? 'pointer' : 'default', fontFamily: 'inherit' }}>
            Log In
          </button>
        </div>

        <button
          type="submit"
          disabled={!emailValid || submitting}
          style={{
            width: '100%',
            padding: '12px',
            background: emailValid && !submitting ? 'var(--primary)' : '#d4d4d4',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: emailValid && !submitting ? 'pointer' : 'not-allowed',
            transition: 'background .15s',
          }}>
          {submitting ? 'Continuing…' : 'Continue'}
        </button>
      </form>

      <p style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', marginTop: '18px', lineHeight: 1.5 }}>
        By continuing, you agree to iterait's Terms &amp; Privacy Policy
      </p>
    </OnboardingShell>
  )
}
