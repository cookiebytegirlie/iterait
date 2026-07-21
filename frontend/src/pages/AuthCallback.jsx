import { Link } from 'react-router-dom'
import logo from '/iterait-logo.svg'

// GitHub OAuth redirect lands here. TODO(frontend + backend): exchange the
// ?code= param with the backend, establish a session, then redirect to
// /dashboard. For now it's a placeholder so the route exists.
export default function AuthCallback() {
  return (
    <div className="bg-gradient-hero flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-[14px] border border-border bg-surface p-8 text-center shadow-[var(--shadow-pop)]">
        <img src={logo} alt="" className="mx-auto h-9 w-9" />
        <div className="font-display mt-3 text-lg font-semibold tracking-tight text-ink">iterait</div>
        <p className="mt-2 text-sm text-ink-2">Finishing GitHub sign-in…</p>
        <p className="mt-1 text-xs text-ink-3">
          Stub — exchange <code>?code</code> with the backend, then redirect.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-medium text-ink underline">
          Continue to dashboard
        </Link>
      </div>
    </div>
  )
}
