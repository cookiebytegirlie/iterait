import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import OnboardingShell from '../components/OnboardingShell.jsx'

const PERMISSIONS = [
  'Read repositories (public & private)',
  'Read commit history',
  'Read code files',
  'Push commits to repositories (for applying Actions)',
]

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

// Since there's no registered GitHub OAuth app yet, "authorizing" is mocked
// entirely client-side (short delay, then a canned GitHub identity). Swap
// handleAuthorize for a real redirect to GitHub's OAuth authorize URL once
// an app is registered — see docs/iterait-build-flow.md.
export default function AuthorizeGitHub() {
  const navigate = useNavigate()
  const { connectGithub } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleAuthorize() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      await connectGithub()
      navigate('/dashboard')
    } catch (e) {
      setError(e.message || 'Something went wrong — try again.')
      setLoading(false)
    }
  }

  return (
    <OnboardingShell step={2} totalSteps={2}>
      <h1 className="text-center text-2xl font-semibold tracking-tight text-ink">Connect your GitHub account</h1>
      <p className="mt-2 text-center text-sm text-ink-2">
        iterait reads your repositories' commit history to build the version timeline. Your login credentials are
        never stored.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {PERMISSIONS.map((p) => (
          <div key={p} className="flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5">
            <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded bg-ink text-[10px] text-white">✓</span>
            <span className="text-sm text-ink-2">{p}</span>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleAuthorize}
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-lg bg-ink py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        <GitHubIcon />
        {loading ? 'Authorizing…' : 'Authorize with GitHub'}
      </button>

      <p className="mt-4 text-center text-xs text-ink-3">You can manage permissions in GitHub settings anytime.</p>
    </OnboardingShell>
  )
}
