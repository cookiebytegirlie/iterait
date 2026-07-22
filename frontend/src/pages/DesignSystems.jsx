import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import DesignSystemCard from '../components/DesignSystemCard.jsx'
import EmptyState from '../components/EmptyState.jsx'

// Grid of the user's design systems — folders of saved components, grouping
// only (no token extraction).
export default function DesignSystems() {
  const [designSystems, setDesignSystems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [showNewDialog, setShowNewDialog] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  useEffect(() => {
    let alive = true
    api
      .listDesignSystems()
      .then((data) => alive && setDesignSystems(data.designSystems))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  async function handleCreate() {
    if (!name.trim() || creating) return
    setCreating(true)
    setCreateError(null)
    try {
      const { designSystem } = await api.createDesignSystem(name.trim(), description.trim())
      // Guard against duplicates so this stays correct under StrictMode's
      // double-invoked updater functions in development.
      setDesignSystems((prev) => (prev.some((d) => d.id === designSystem.id) ? prev : [...prev, designSystem]))
      setShowNewDialog(false)
      setName('')
      setDescription('')
    } catch (e) {
      setCreateError(e.message || 'Something went wrong creating this design system.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Design Systems</h1>
          <p className="mt-1 text-sm text-ink-2">Group saved components into your own systems.</p>
        </div>
        <button
          onClick={() => setShowNewDialog(true)}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white"
        >
          + New design system
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!loading && designSystems.length === 0 && (
        <div className="mt-8">
          <EmptyState
            title="No design systems yet"
            description="Create one to start grouping your saved components"
          />
        </div>
      )}

      {designSystems.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {designSystems.map((d) => (
            <DesignSystemCard key={d.id} designSystem={d} />
          ))}
        </div>
      )}

      {showNewDialog && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowNewDialog(false) }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
        >
          <div className="w-full max-w-md rounded-[14px] bg-surface p-6 shadow-[var(--shadow-soft)]">
            <div className="mb-1 flex items-start justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-ink">New design system</h2>
              <button onClick={() => setShowNewDialog(false)} className="text-ink-3 hover:text-ink">×</button>
            </div>
            <p className="mb-4 text-sm text-ink-2">Create a new folder to group saved components.</p>

            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-2">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Marketing UI"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-ink-3"
              />
            </label>

            <label className="mb-1 block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-2">
                Description <span className="font-normal text-ink-3">(optional)</span>
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What's this design system for?"
                className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-ink-3"
              />
            </label>

            {createError && <p className="mt-3 text-sm text-red-600">{createError}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowNewDialog(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-2">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim() || creating}
                className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
