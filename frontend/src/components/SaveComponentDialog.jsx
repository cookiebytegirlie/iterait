import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { extractComponent, renderFragment } from '../lib/extractComponent.js'
import { tagTone } from '../lib/gradients.js'

const TYPE_OPTIONS = ['button', 'modal', 'popup', 'card', 'nav', 'form', 'input', 'badge', 'hero', 'other']

// Modal for saving the currently inspected node into the library. Given a
// live (same-origin, inspect-mode) `iframe` and the `rootSelector` of the
// selected node, this runs extractComponent() on open — pulling the node's
// real CSSOM (hover/focus states, pseudo-elements, breakpoints, animation)
// rather than a flattened snapshot — and renders the result in its own
// plain sandboxed iframe as proof it's genuinely self-contained.
//
// `iframe` may briefly be the previous mode/version's element while
// Versions.jsx's inspect-mode iframe reloads (e.g. right after a layers-row
// click force-switches into Inspect). Extraction just waits: it only acts
// once `iframe.contentDocument` is accessible AND `rootSelector` actually
// resolves in it, and re-tries whenever a fresher `iframe` prop arrives.
//
// Render with a `key` tied to the selection (see Versions.jsx) so switching
// which node is being saved resets this dialog's state.
export default function SaveComponentDialog({ isOpen, onClose, onSave, iframe, rootSelector, matchedComponent }) {
  const [extraction, setExtraction] = useState(null)
  const [extractError, setExtractError] = useState(null)
  const [name, setName] = useState('')
  const [type, setType] = useState(TYPE_OPTIONS[0])
  const [lineageMode, setLineageMode] = useState('new') // 'new' | 'version'
  const [parentId, setParentId] = useState('')
  const [libraryComponents, setLibraryComponents] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    if (!isOpen || !iframe || !rootSelector) return
    const doc = iframe.contentDocument
    if (!doc) return // sandboxed or not-yet-loaded — wait for a fresher `iframe` prop
    let rootEl
    try {
      rootEl = doc.querySelector(rootSelector)
    } catch {
      return
    }
    if (!rootEl) return // selector doesn't resolve in this document (yet) — wait for a fresher `iframe` prop
    try {
      const result = extractComponent(iframe, rootEl)
      const prefilledName = matchedComponent?.name || rootEl.tagName.toLowerCase()
      // Deferred a tick so this isn't a bare synchronous setState call at
      // the top of the effect body (see VersionPreview.jsx for the same
      // pattern/reasoning).
      queueMicrotask(() => {
        setExtraction(result)
        setName(prefilledName)
        setType(result.type)
      })
    } catch (e) {
      const message = e.message || 'Could not read this component’s styles.'
      queueMicrotask(() => setExtractError(message))
    }
  }, [isOpen, iframe, rootSelector, matchedComponent])

  useEffect(() => {
    if (!isOpen) return
    let alive = true
    api.listComponents().then((data) => alive && setLibraryComponents(data.components)).catch(() => {})
    return () => { alive = false }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  async function handleSave() {
    if (!name.trim() || saving || !extraction) return
    setSaving(true)
    setSaveError(null)
    try {
      await onSave({
        name: name.trim(),
        type,
        html: extraction.html,
        css: extraction.css,
        capturedWidth: extraction.capturedWidth,
        ...(lineageMode === 'version' && parentId ? { lineageId: parentId } : {}),
      })
    } catch (e) {
      setSaveError(e.message || 'Something went wrong saving this component.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-lg rounded-[14px] bg-surface p-6 shadow-[var(--shadow-soft)]">
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-ink">Save to library</h2>
          <button onClick={onClose} className="text-ink-3 hover:text-ink">×</button>
        </div>
        <p className="mb-3 text-sm text-ink-2">
          This component will be added to your saved library, frozen at this version.
        </p>

        <p className="mb-1.5 text-xs text-ink-3">Preview is the extracted component, rendered on its own.</p>
        <div className="mb-4 h-44 overflow-hidden rounded-lg border border-border bg-canvas">
          {extraction ? (
            <iframe
              sandbox=""
              srcDoc={renderFragment(extraction)}
              className="h-full w-full"
              title={`${name || 'component'} preview`}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-ink-3">
              {extractError || 'Preparing preview…'}
            </div>
          )}
        </div>

        <label className="mb-3 block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-2">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this component"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink outline-none focus:border-ink-3"
          />
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-ink-2">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-ink-3"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <span className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-3">
            Auto-detected as
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${tagTone(type)}`}>
              {type}
            </span>
            — edit if wrong.
          </span>
        </label>

        <div className="mb-1">
          <span className="mb-1.5 block text-xs font-semibold text-ink-2">Save as</span>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="radio"
                name="lineageMode"
                checked={lineageMode === 'new'}
                onChange={() => setLineageMode('new')}
              />
              A new component
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="radio"
                name="lineageMode"
                checked={lineageMode === 'version'}
                onChange={() => setLineageMode('version')}
              />
              A new version of…
            </label>
          </div>
          {lineageMode === 'version' && (
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-ink-3"
            >
              <option value="">Choose a component…</option>
              {libraryComponents.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        {extraction?.warnings?.length > 0 && (
          <div className="mt-3 rounded-lg bg-butter px-3 py-2 text-xs text-butter-ink">
            {extraction.warnings.map((w, i) => <p key={i}>{w}</p>)}
          </div>
        )}

        {saveError && <p className="mt-3 text-sm text-red-600">{saveError}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-2">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving || !extraction}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save to library'}
          </button>
        </div>
      </div>
    </div>
  )
}
