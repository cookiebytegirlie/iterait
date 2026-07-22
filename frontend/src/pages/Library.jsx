import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import ComponentCard from '../components/ComponentCard.jsx'
import EmptyState from '../components/EmptyState.jsx'

const TYPES = ['button', 'modal', 'popup', 'card', 'nav', 'form', 'input', 'badge', 'hero']

// Gallery of components saved from project versions. Fetches the full
// library once and filters client-side by type — cheap, and keeps the
// filter pills instant instead of round-tripping on every click.
export default function Library() {
  const [components, setComponents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [typeFilter, setTypeFilter] = useState(null) // null = All

  useEffect(() => {
    let alive = true
    api
      .listComponents()
      .then((data) => alive && setComponents(data.components))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const typesPresent = TYPES.filter((t) => components.some((c) => c.type === t))
  const filtered = typeFilter ? components.filter((c) => c.type === typeFilter) : components

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Component Library</h1>
      <p className="mt-1 text-sm text-ink-2">Components you've saved from your project versions.</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTypeFilter(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              typeFilter === null ? 'bg-ink text-white' : 'border border-border text-ink-2 hover:bg-canvas'
            }`}
          >
            All
          </button>
          {typesPresent.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                typeFilter === t ? 'bg-ink text-white' : 'border border-border text-ink-2 hover:bg-canvas'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="text-xs text-ink-3">{filtered.length} component{filtered.length === 1 ? '' : 's'}</span>
      </div>

      {!loading && components.length === 0 && (
        <div className="mt-8">
          <EmptyState
            title="No components yet"
            description="Open a project version and save your first component"
          />
        </div>
      )}

      {!loading && components.length > 0 && filtered.length === 0 && (
        <p className="mt-8 text-sm text-ink-3">No {typeFilter} components saved yet.</p>
      )}

      {filtered.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {filtered.map((c) => (
            <ComponentCard key={c.id} component={c} />
          ))}
        </div>
      )}
    </div>
  )
}
