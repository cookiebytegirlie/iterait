function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const STATUS_STYLE = {
  added: { label: 'NEW', className: 'bg-mint text-mint-ink' },
  modified: { label: 'MODIFIED', className: 'bg-butter text-butter-ink' },
  removed: { label: 'REMOVED', className: 'bg-blush text-blush-ink' },
}

// Commit detail: selected commit's header, files-changed summary, and a
// placeholder where the real diff viewer will go once it's designed. The
// "Save as Action" / "View on GitHub" / stats panel lives beside this in
// Timeline.jsx, not inside this component.
export default function CommitDetail({ commit, isLoading, githubCommitUrl }) {
  if (isLoading) {
    return (
      <div className="rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-soft)]">
        <div className="h-5 w-2/3 animate-pulse rounded bg-canvas" />
        <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-canvas" />
      </div>
    )
  }

  if (!commit) {
    return (
      <div className="flex h-full items-center justify-center rounded-[14px] border border-border bg-surface p-6 text-sm text-ink-3 shadow-[var(--shadow-soft)]">
        Select a commit to view details.
      </div>
    )
  }

  const status = STATUS_STYLE

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">
          <span className="mr-2 font-mono text-sm text-ink-3">{commit.sha.slice(0, 7)}</span>
          {commit.message}
        </h2>
        <p className="mt-1 text-sm text-ink-2">
          {commit.author} · {timeAgo(commit.timestamp)}
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Files Changed</h3>
        <div className="flex flex-col gap-2">
          {commit.files.map((f) => {
            const s = status[f.status] || { label: f.status.toUpperCase(), className: 'bg-canvas text-ink-2' }
            return (
              <div
                key={f.filename}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.className}`}>{s.label}</span>
                  <span className="truncate font-mono text-xs text-ink">{f.filename}</span>
                </div>
                <span className="ml-3 shrink-0 text-xs text-ink-3">
                  <span className="text-green-600">+{f.additions}</span>{' '}
                  <span className="text-red-600">-{f.deletions}</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-[14px] border border-dashed border-border p-8 text-center">
        <p className="text-sm text-ink-2">Diff viewer coming soon</p>
        <a href={githubCommitUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-ink underline">
          View full diff on GitHub →
        </a>
      </div>
    </div>
  )
}
