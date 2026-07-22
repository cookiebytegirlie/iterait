import { Link } from 'react-router-dom'
import { cardGradient } from '../lib/gradients.js'

// Gallery card for a design system: gradient cover (matching ComponentCard's
// card shell), name, description, and how many components it groups.
export default function DesignSystemCard({ designSystem }) {
  const count = designSystem.componentIds.length
  return (
    <Link
      to={`/design-systems/${designSystem.id}`}
      className="flex flex-col overflow-hidden rounded-[14px] border border-border bg-surface shadow-[var(--shadow-soft)] transition-shadow hover:shadow-md"
    >
      <div className={`h-32 w-full ${cardGradient(designSystem.id)}`} />
      <div className="p-4">
        <div className="truncate text-sm font-medium text-ink">{designSystem.name}</div>
        {designSystem.description && (
          <div className="mt-1 truncate text-xs text-ink-2">{designSystem.description}</div>
        )}
        <div className="mt-2 text-xs text-ink-3">{count} component{count === 1 ? '' : 's'}</div>
      </div>
    </Link>
  )
}
