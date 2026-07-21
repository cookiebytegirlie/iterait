import CommitListItem from './CommitListItem.jsx'

function Skeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-canvas" />
      ))}
    </div>
  )
}

// Left sidebar: scrollable commit list. Fires onLoadMore when the user
// scrolls near the bottom, so the caller can fetch the next page.
export default function CommitList({ commits, selectedSha, onSelectCommit, isLoading, hasMore, onLoadMore }) {
  function handleScroll(e) {
    if (!hasMore || isLoading) return
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - (scrollTop + clientHeight) < 120) onLoadMore()
  }

  return (
    <div className="flex h-full flex-col rounded-[14px] border border-border bg-surface shadow-[var(--shadow-soft)]">
      <div className="border-b border-border px-4 py-3 text-sm font-semibold text-ink">Commits</div>
      <div onScroll={handleScroll} className="flex-1 overflow-y-auto p-2">
        {commits.length === 0 && isLoading && <Skeleton />}
        {commits.length === 0 && !isLoading && (
          <p className="px-2 py-4 text-sm text-ink-3">No commits yet.</p>
        )}
        {commits.map((c) => (
          <CommitListItem
            key={c.sha}
            commit={c}
            isSelected={c.sha === selectedSha}
            onClick={() => onSelectCommit(c.sha)}
          />
        ))}
        {commits.length > 0 && isLoading && (
          <div className="px-3 py-3 text-center text-xs text-ink-3">Loading more…</div>
        )}
      </div>
    </div>
  )
}
