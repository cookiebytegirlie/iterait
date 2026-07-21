import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import OnboardingShell from '../../components/OnboardingShell'

const PERMISSIONS = [
  'Read repositories (public & private)',
  'Read commit history',
  'Read code files',
  'Push commits to repositories (for applying Actions)',
]

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
    </svg>
  )
}

export default function AuthorizeGitHub() {
  const navigate = useNavigate()
  const { connectGithub, completeOnboarding } = useAuth()
  const [loading, setLoading] = useState(false)

  function handleAuthorize() {
    if (loading) return
    setLoading(true)
    setTimeout(() => {
      connectGithub('mock-gh-token-' + Date.now(), {
        login: 'sydneynguyyen',
        avatar: 'https://avatars.githubusercontent.com/u/123456',
        name: 'Sydney Nguyen',
      })
      completeOnboarding()
      navigate('/dashboard')
    }, 700)
  }

  return (
    <OnboardingShell step={2} totalSteps={2}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.02em', marginBottom: '8px' }}>
        Connect your GitHub account
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.5, marginBottom: '24px' }}>
        iterait reads your repository's commit history to track design changes. Later, you can apply saved changes back to your repos. Your login credentials are never stored.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {PERMISSIONS.map(p => (
          <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: '1.5px solid #ececea', borderRadius: '10px' }}>
            <span style={{
              width: 18, height: 18, borderRadius: '5px', background: 'var(--primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0,
            }}>✓</span>
            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{p}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAuthorize}
        disabled={loading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '12px',
          background: 'var(--primary)',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: loading ? 'default' : 'pointer',
          fontFamily: 'inherit',
        }}>
        <GitHubIcon />
        {loading ? 'Authorizing…' : 'Authorize with GitHub'}
      </button>

      <p style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', marginTop: '16px', lineHeight: 1.5 }}>
        You can manage permissions in GitHub settings anytime
      </p>
    </OnboardingShell>
  )
}
