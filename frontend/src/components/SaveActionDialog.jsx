import { useState } from 'react'
import { tagTone } from '../lib/gradients.js'

const TAG_SUGGESTIONS = ['button', 'component', 'ui', 'layout', 'responsive', 'typography', 'color']

// Modal for turning a commit into a reusable Action. onSave receives
// { name, description, tags } and is expected to return a promise (so this
// component can show a loading state and surface errors).
export default function SaveActionDialog({ isOpen, onClose, onSave, commit }) {
  const [name, setName] = useState(commit?.message || '')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen || !commit) return null

  function addTag(tag) {
    const t = tag.trim().toLowerCase()
    if (!t || tags.includes(t)) return
    setTags([...tags, t])
    setTagInput('')
  }

  function handleTagKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  async function handleSave() {
    if (!name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), description: description.trim(), tags })
    } catch (e) {
      setError(e.message || 'Something went wrong saving this Action.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-md rounded-[14px] bg-surface p-6 shadow-[var(--shadow-soft)]">
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Save this change as an Action</h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink">×</button>
        </div>
        <p className="mb-4 text-sm text-ink-2">
          This commit will become a reusable Action you can apply to other projects.
        </p>

        <div className="mb-4 rounded-lg border border-border bg-canvas px-3 py-2">
          <div className="text-sm font-medium text-ink">{commit.message}</div>
          <div className="mt-0.5 text-xs text-ink-3">{commit.author}</div>
        </div>

        <label className="mb-3 block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-2">Action name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this change"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-ink-3"
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-2">
            Description <span className="font-normal text-ink-3">(optional)</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe what this change does"
            className="w-full resize-none rounded-lg border border-border px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-ink-3"
          />
        </label>

        <div className="mb-1">
          <span className="mb-1.5 block text-xs font-semibold text-ink-2">
            Tags <span className="font-normal text-ink-3">(optional)</span>
          </span>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tagTone(t)}`}>
                {t}
                <button onClick={() => setTags(tags.filter((x) => x !== t))} className="opacity-60 hover:opacity-100">×</button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Add a tag and press Enter"
            className="mb-2 w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-ink-3"
          />
          <div className="flex flex-wrap gap-1.5">
            {TAG_SUGGESTIONS.filter((s) => !tags.includes(s)).map((s) => (
              <button
                key={s}
                onClick={() => addTag(s)}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-ink-2 hover:bg-canvas"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-2">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Action'}
          </button>
        </div>
      </div>
    </div>
  )
}
