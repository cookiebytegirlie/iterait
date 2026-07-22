import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { tagTone } from '../lib/gradients.js'
import { renderFragment } from '../lib/extractComponent.js'

const TYPE_OPTIONS = ['button', 'modal', 'popup', 'card', 'nav', 'form', 'input', 'badge', 'hero']
const TARGET_TOOLS = ['Claude', 'Cursor', 'Lovable', 'v0', 'Replit']

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'component'
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function wrapAsSvg(html, css) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml"><style>${css}</style>${html}</div>
  </foreignObject>
</svg>`
}

// Single saved component: large preview, export options, and design-system
// membership. Everything runs off the mock client — no backend required.
export default function ComponentDetail() {
  const { componentId } = useParams()
  const [component, setComponent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sourceVersion, setSourceVersion] = useState(null)
  const [lineageVariants, setLineageVariants] = useState([])
  const [displayType, setDisplayType] = useState(TYPE_OPTIONS[0])
  const [toast, setToast] = useState(null)

  const [designSystems, setDesignSystems] = useState([])
  const [dsMenuOpen, setDsMenuOpen] = useState(false)
  const [addingSystemId, setAddingSystemId] = useState(null)
  const [newSystemName, setNewSystemName] = useState('')
  const [creatingSystem, setCreatingSystem] = useState(false)

  const [promptOpen, setPromptOpen] = useState(false)
  const [targetTool, setTargetTool] = useState(TARGET_TOOLS[0])
  const [promptText, setPromptText] = useState('')
  const [generatingPrompt, setGeneratingPrompt] = useState(false)
  const [promptError, setPromptError] = useState(null)
  const [copied, setCopied] = useState(false)

  // Reset for a new componentId during render rather than in an effect —
  // see react.dev "Adjusting state when a prop changes".
  const [loadedComponentId, setLoadedComponentId] = useState(componentId)
  if (componentId !== loadedComponentId) {
    setLoadedComponentId(componentId)
    setComponent(null)
    setLoading(true)
  }

  useEffect(() => {
    let alive = true
    api
      .getComponent(componentId)
      .then((data) => {
        if (!alive) return
        setComponent(data.component)
        if (data.component) setDisplayType(data.component.type)
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [componentId])

  useEffect(() => {
    if (!component) return
    let alive = true
    const [owner, repo] = component.sourceProject.split('/')
    api
      .getVersion(owner, repo, component.sourceVersionId)
      .then((data) => alive && setSourceVersion(data.version))
      .catch(() => {})
    return () => { alive = false }
  }, [component])

  useEffect(() => {
    if (!component) return
    let alive = true
    api
      .getLineage(component.lineageId || component.id)
      .then((data) => alive && setLineageVariants(data.variants))
      .catch(() => {})
    return () => { alive = false }
  }, [component])

  useEffect(() => {
    let alive = true
    api
      .listDesignSystems()
      .then((data) => alive && setDesignSystems(data.designSystems))
      .catch(() => {})
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  async function handleAddToSystem(designSystemId) {
    setAddingSystemId(designSystemId)
    try {
      await api.addComponentToSystem(designSystemId, component.id)
      setComponent((prev) => ({
        ...prev,
        designSystemIds: [...new Set([...(prev.designSystemIds || []), designSystemId])],
      }))
      setToast(`Added to ${designSystems.find((d) => d.id === designSystemId)?.name}`)
      setDsMenuOpen(false)
    } catch (e) {
      setToast(e.message || 'Could not add to design system.')
    } finally {
      setAddingSystemId(null)
    }
  }

  async function handleCreateSystem() {
    const name = newSystemName.trim()
    if (!name || creatingSystem) return
    setCreatingSystem(true)
    try {
      const { designSystem } = await api.createDesignSystem(name, '')
      // Guard against duplicates so this stays correct under StrictMode's
      // double-invoked updater functions in development.
      setDesignSystems((prev) => (prev.some((d) => d.id === designSystem.id) ? prev : [...prev, designSystem]))
      setNewSystemName('')
      await handleAddToSystem(designSystem.id)
    } catch (e) {
      setToast(e.message || 'Could not create design system.')
    } finally {
      setCreatingSystem(false)
    }
  }

  function openPromptDialog() {
    setPromptOpen(true)
    setPromptText('')
    setPromptError(null)
    setCopied(false)
  }

  async function handleGeneratePrompt() {
    setGeneratingPrompt(true)
    setPromptError(null)
    try {
      const { prompt } = await api.generateComponentPrompt(component.id, targetTool)
      setPromptText(prompt)
    } catch (e) {
      setPromptError(e.message || 'Could not generate a prompt.')
    } finally {
      setGeneratingPrompt(false)
    }
  }

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(promptText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="h-5 w-1/4 animate-pulse rounded bg-canvas" />
        <div className="mt-6 h-80 animate-pulse rounded-[14px] bg-canvas" />
      </div>
    )
  }

  if (error || !component) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-red-600">{error || 'Component not found.'}</p>
        <Link to="/library" className="mt-4 inline-block text-sm text-ink-2 hover:text-ink">← Back to library</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-ink-3">
          <Link to="/library" className="hover:text-ink">Library</Link>
          <span>/</span>
          <span className="font-medium text-ink">{component.name}</span>
        </div>
        <Link to="/library" className="text-sm text-ink-2 hover:text-ink">← Back to library</Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="h-80 overflow-hidden rounded-[14px] border border-border bg-surface shadow-[var(--shadow-soft)]">
            <iframe
              sandbox=""
              srcDoc={renderFragment(component)}
              className="h-full w-full"
              title={`${component.name} preview`}
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-ink">{component.name}</h1>
            <div className="relative inline-block">
              <select
                value={displayType}
                onChange={(e) => setDisplayType(e.target.value)}
                className={`cursor-pointer appearance-none rounded-full py-1 pl-3 pr-6 text-xs font-medium outline-none ${tagTone(displayType)}`}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-60">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>

          <p className="mt-2 text-sm text-ink-2">
            Saved from <span className="font-medium text-ink">{component.sourceProject}</span>
            {sourceVersion && <> · version {sourceVersion.versionNumber} ({sourceVersion.label})</>}
          </p>
          <p className="mt-1 text-xs text-ink-3">
            Frozen at save time — this snapshot won't change even if the project's later commits do.
          </p>
          {lineageVariants.length > 1 && (
            <button
              onClick={() => setToast('Version history view coming soon')}
              className="mt-2 inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs font-medium text-ink-2 hover:bg-canvas"
            >
              {lineageVariants.length} versions · v{component.variantNumber}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-[14px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-3">Export</h3>

            <button
              onClick={openPromptDialog}
              className="rounded-lg bg-ink px-3 py-2 text-left text-sm font-medium text-white hover:opacity-90"
            >
              Generate prompt
            </button>

            <button
              onClick={() => downloadFile(`${slugify(component.name)}.html`, renderFragment(component), 'text/html')}
              className="rounded-lg border border-ink px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-canvas"
            >
              Download HTML
            </button>

            <button
              onClick={() => downloadFile(`${slugify(component.name)}.svg`, wrapAsSvg(component.html, component.css), 'image/svg+xml')}
              className="rounded-lg border border-border px-3 py-2 text-left text-sm font-medium text-ink-2 hover:bg-canvas"
            >
              Download SVG
            </button>

            {/* TODO: wire up real PNG export via the html-to-image package once
                it's added as a dependency (not currently installed — avoid
                pulling in a new package without approval). */}
            <button
              disabled
              title="PNG export coming soon"
              className="cursor-not-allowed rounded-lg border border-border px-3 py-2 text-left text-sm font-medium text-ink-3 opacity-50"
            >
              Download PNG
            </button>
          </div>

          <div className="relative flex flex-col gap-2 rounded-[14px] border border-border bg-surface p-4 shadow-[var(--shadow-soft)]">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-3">Design systems</h3>
            <div className="flex flex-wrap gap-1.5">
              {designSystems
                .filter((d) => component.designSystemIds?.includes(d.id))
                .map((d) => (
                  <span key={d.id} className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-ink-2">
                    {d.name}
                  </span>
                ))}
              {!(component.designSystemIds?.length > 0) && (
                <span className="text-xs text-ink-3">Not in any design system yet.</span>
              )}
            </div>

            <button
              onClick={() => setDsMenuOpen((o) => !o)}
              className="mt-1 rounded-lg bg-ink px-3 py-2 text-sm font-medium text-white"
            >
              + Add to design system
            </button>

            {dsMenuOpen && (
              <div className="absolute left-4 right-4 top-full z-10 mt-1 rounded-[14px] border border-border bg-surface p-2 shadow-[var(--shadow-soft)]">
                {designSystems.map((d) => {
                  const alreadyIn = component.designSystemIds?.includes(d.id)
                  return (
                    <button
                      key={d.id}
                      onClick={() => handleAddToSystem(d.id)}
                      disabled={alreadyIn || addingSystemId === d.id}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm text-ink hover:bg-canvas disabled:opacity-50"
                    >
                      {d.name}
                      {alreadyIn && <span className="text-xs text-ink-3">Added ✓</span>}
                    </button>
                  )
                })}
                <div className="mt-1 flex gap-1.5 border-t border-border pt-2">
                  <input
                    value={newSystemName}
                    onChange={(e) => setNewSystemName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSystem()}
                    placeholder="New design system…"
                    className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm text-ink outline-none focus:border-ink-3"
                  />
                  <button
                    onClick={handleCreateSystem}
                    disabled={!newSystemName.trim() || creatingSystem}
                    className="shrink-0 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    {creatingSystem ? '…' : 'Create'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {promptOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setPromptOpen(false) }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
        >
          <div className="w-full max-w-lg rounded-[14px] bg-surface p-6 shadow-[var(--shadow-soft)]">
            <div className="mb-1 flex items-start justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-ink">Generate a prompt</h2>
              <button onClick={() => setPromptOpen(false)} className="text-ink-3 hover:text-ink">×</button>
            </div>
            <p className="mb-4 text-sm text-ink-2">
              Get a pasteable prompt to recreate this component in another AI tool.
            </p>

            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-2">Target tool</span>
              <select
                value={targetTool}
                onChange={(e) => setTargetTool(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-ink-3"
              >
                {TARGET_TOOLS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <button
              onClick={handleGeneratePrompt}
              disabled={generatingPrompt}
              className="mb-3 w-full rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {generatingPrompt ? 'Generating…' : 'Generate'}
            </button>

            {promptError && <p className="mb-3 text-sm text-red-600">{promptError}</p>}

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-ink-2">Prompt</span>
              <textarea
                readOnly
                value={promptText}
                rows={6}
                placeholder="Generated prompt will appear here…"
                className="w-full resize-none rounded-lg border border-border bg-canvas px-3 py-2 text-sm leading-relaxed text-ink outline-none"
              />
            </label>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setPromptOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-2">
                Close
              </button>
              <button
                onClick={handleCopyPrompt}
                disabled={!promptText}
                className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          </div>
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
