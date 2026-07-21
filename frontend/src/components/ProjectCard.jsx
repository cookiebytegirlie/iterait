import { cardGradient } from '../lib/gradients.js'

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function ProjectCard({ project, onClick }) {
  const cover = cardGradient(`${project.repo.owner}/${project.repo.name}`)

  return (
    <button
      onClick={onClick}
      className="overflow-hidden rounded-[14px] border border-border bg-surface text-left shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
    >
      <div className={`h-28 w-full ${cover}`} />
      <div className="p-5">
        <div className="font-display text-base font-semibold text-ink">{project.name}</div>
        <div className="mt-0.5 text-xs text-ink-3">
          {project.repo.owner}/{project.repo.name}
        </div>
        <div className="mt-3 text-xs text-ink-2">
          {project.repo.commitCount.toLocaleString()} commits · Last updated {timeAgo(project.lastUpdated)}
        </div>
        <div className="mt-4 text-sm font-medium text-ink">View Project →</div>
      </div>
    </button>
  )
}
