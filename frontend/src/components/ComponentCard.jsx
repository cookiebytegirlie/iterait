import { Link } from 'react-router-dom'
import { tagTone } from '../lib/gradients.js'
import { renderFragment } from '../lib/extractComponent.js'

// Gallery card for a saved library component: sandboxed live preview, name,
// type badge, and which project it was saved from. The iframe preview is
// pointer-events-none so a click anywhere on the card follows the Link
// instead of being swallowed by the iframe. When the component belongs to a
// lineage with more than one saved variant, listComponents() returns the
// latest one with a `variants` count — surfaced here as a "N versions" badge.
export default function ComponentCard({ component }) {
  return (
    <Link
      to={`/library/${component.id}`}
      className="flex flex-col overflow-hidden rounded-[14px] border border-border bg-surface shadow-[var(--shadow-soft)] transition-shadow hover:shadow-md"
    >
      <div className="relative h-32 w-full overflow-hidden bg-canvas">
        <iframe
          sandbox=""
          srcDoc={renderFragment(component)}
          className="h-full w-full pointer-events-none"
          title={`${component.name} preview`}
        />
        {component.variants > 1 && (
          <span className="absolute right-2 top-2 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-medium text-white">
            {component.variants} versions
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="truncate text-sm font-medium text-ink">{component.name}</div>
        <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${tagTone(component.type)}`}>
          {component.type}
        </span>
        <div className="mt-2 truncate text-xs text-ink-3">{component.sourceProject}</div>
      </div>
    </Link>
  )
}
