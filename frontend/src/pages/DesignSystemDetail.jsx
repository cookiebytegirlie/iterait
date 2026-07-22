import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import ComponentCard from '../components/ComponentCard.jsx'
import EmptyState from '../components/EmptyState.jsx'

// A single design system: header + the library gallery filtered down to the
// components grouped into it. Grouping only — no token extraction.
export default function DesignSystemDetail() {
  const { id } = useParams()
  const [designSystem, setDesignSystem] = useState(null)
  const [components, setComponents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  // Reset for a new id during render rather than in an effect — see
  // react.dev "Adjusting state when a prop changes".
  const [loadedId, setLoadedId] = useState(id)
  if (id !== loadedId) {
    setLoadedId(id)
    setDesignSystem(null)
    setComponents([])
    setLoading(true)
  }

  useEffect(() => {
    let alive = true
    Promise.all([api.listDesignSystems(), api.listComponents({ designSystemId: id })])
      .then(([dsData, compData]) => {
        if (!alive) return
        setDesignSystem(dsData.designSystems.find((d) => d.id === id) || null)
        setComponents(compData.components)
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [id])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function handleRemove(componentId) {
    try {
      await api.removeComponentFromSystem(id, componentId)
      setComponents((prev) => prev.filter((c) => c.id !== componentId))
      setToast('Removed from system')
    } catch (e) {
      setToast(e.message || 'Could not remove component.')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="h-6 w-1/3 animate-pulse rounded bg-canvas" />
      </div>
    )
  }

  if (error || !designSystem) {
    return (
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-red-600">{error || 'Design system not found.'}</p>
        <Link to="/design-systems" className="mt-4 inline-block text-sm text-ink-2 hover:text-ink">← Back to Design Systems</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-ink-3">
          <Link to="/design-systems" className="hover:text-ink">Design Systems</Link>
          <span>/</span>
          <span className="font-medium text-ink">{designSystem.name}</span>
        </div>
        <Link to="/design-systems" className="text-sm text-ink-2 hover:text-ink">← Back to Design Systems</Link>
      </div>

      <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">{designSystem.name}</h1>
      {designSystem.description && <p className="mt-1 text-sm text-ink-2">{designSystem.description}</p>}
      <p className="mt-1 text-xs text-ink-3">{components.length} component{components.length === 1 ? '' : 's'}</p>

      {components.length === 0 && (
        <div className="mt-8">
          <EmptyState
            title="No components in this system yet"
            description="Add some from the library"
          />
        </div>
      )}

      {components.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {components.map((c) => (
            <div key={c.id} className="relative">
              <ComponentCard component={c} />
              <button
                onClick={() => handleRemove(c.id)}
                className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white hover:bg-black/80"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-soft)]">
          {toast}
        </div>
      )}
    </div>
  )
}
