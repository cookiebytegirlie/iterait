import { Link } from 'react-router-dom'

// TODO(frontend team): GitHub OAuth "Connect repo" flow + list the user's
// connected projects. For now this links into a sample timeline so the flow
// is walkable end-to-end.
export default function Dashboard() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-2">
        Connect a GitHub repo, then browse its commit history as versions.
      </p>

      <div className="mt-6 rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
        <button className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white">
          Connect GitHub repo
        </button>
        <p className="mt-3 text-xs text-ink-3">
          Stub — wire to GitHub OAuth (<code>/auth/callback</code>).
        </p>
      </div>

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-ink-3">
        Your projects
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <Link
          to="/timeline/basmah/lovable-components"
          className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
        >
          <div className="text-sm font-medium">basmah/lovable-components</div>
          <div className="mt-1 text-xs text-ink-3">React · 3 versions</div>
        </Link>
      </div>
    </div>
  )
}
