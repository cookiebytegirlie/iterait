function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function Skeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-canvas" />
      ))}
    </div>
  )
}

// Left sidebar: scrollable list of a project's version checkpoints, newest
// first. Selected item mirrors Layout's sidebar active state (bg-ink/white).
export default function VersionList({ versions, selectedVersionId, onSelectVersion, isLoading }) {
  return (
    <div className="flex h-full flex-col rounded-[14px] border border-border bg-surface shadow-[var(--shadow-soft)]">
      <div className="border-b border-border px-4 py-3 text-sm font-semibold text-ink">Versions</div>
      <div className="flex-1 overflow-y-auto p-2">
        {versions.length === 0 && isLoading && <Skeleton />}
        {versions.length === 0 && !isLoading && (
          <p className="px-2 py-4 text-sm text-ink-3">No versions yet.</p>
        )}
        {versions.map((v) => {
          const isSelected = v.id === selectedVersionId
          return (
            <button
              key={v.id}
              onClick={() => onSelectVersion(v.id)}
              className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                isSelected ? 'bg-ink' : 'hover:bg-canvas'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`truncate text-sm font-medium ${isSelected ? 'text-white' : 'text-ink'}`}>{v.label}</span>
                <span className={`shrink-0 text-xs ${isSelected ? 'text-white/70' : 'text-ink-3'}`}>v{v.versionNumber}</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <img
                  src={v.avatar}
                  alt=""
                  className="h-4 w-4 rounded-full"
                  onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
                />
                <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-ink-3'}`}>{v.author}</span>
                <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-ink-3'}`}>· {timeAgo(v.createdAt)}</span>
              </div>
              <div className={`mt-1 text-xs ${isSelected ? 'text-white/70' : 'text-ink-3'}`}>
                {v.componentsCount} component{v.componentsCount === 1 ? '' : 's'}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
