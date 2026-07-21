import { Link } from 'react-router-dom'

// GitHub OAuth redirect lands here. TODO(frontend + backend): exchange the
// ?code= param with the backend, establish a session, then redirect to
// /dashboard. For now it's a placeholder so the route exists.
export default function AuthCallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-[14px] border border-border bg-surface p-8 text-center shadow-[var(--shadow-soft)]">
        <div className="text-lg font-semibold tracking-tight">iterait</div>
        <p className="mt-2 text-sm text-ink-2">Finishing GitHub sign-in…</p>
        <p className="mt-1 text-xs text-ink-3">
          Stub — exchange <code>?code</code> with the backend, then redirect.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm underline">
          Continue to dashboard
        </Link>
      </div>
    </div>
  )
}
