function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function CommitListItem({ commit, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border-l-2 px-3 py-2.5 text-left transition-colors ${
        isSelected ? 'border-ink bg-canvas' : 'border-transparent hover:bg-canvas'
      }`}
    >
      <div className="truncate text-sm font-medium text-ink">{commit.message}</div>
      <div className="mt-1 flex items-center gap-1.5">
        <img src={commit.avatar} alt="" className="h-4 w-4 rounded-full" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
        <span className="text-xs text-ink-3">{commit.author}</span>
        <span className="text-xs text-ink-3">· {timeAgo(commit.timestamp)}</span>
      </div>
    </button>
  )
}
