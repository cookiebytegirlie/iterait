import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import VersionList from '../components/VersionList.jsx'
import VersionPreview from '../components/VersionPreview.jsx'
import LayersPanel from '../components/LayersPanel.jsx'
import SaveComponentDialog from '../components/SaveComponentDialog.jsx'

// Project timeline as version checkpoints: version list on the left, the
// selected version's rendered prototype in the middle, its detected
// components (with save-to-library) on the right.
export default function Versions() {
  const { owner, repo } = useParams()
  const [versions, setVersions] = useState([])
  const [loadingVersions, setLoadingVersions] = useState(true)
  const [selectedVersionIdOverride, setSelectedVersionIdOverride] = useState(null)
  const [versionDetail, setVersionDetail] = useState(null) // { version, components }
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [error, setError] = useState(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [toast, setToast] = useState(null)

  // Shared between VersionPreview's inspector and LayersPanel: a plain
  // selector string/descriptor, not a live DOM node — each side resolves it
  // against its own document (the preview iframe vs. LayersPanel's detached
  // parse of the same snapshotHtml).
  const [previewMode, setPreviewMode] = useState('auto')
  const [selection, setSelection] = useState(null)
  const [hoverSelector, setHoverSelector] = useState(null)

  // The live inspect-mode preview iframe, for the save flow's
  // extractComponent(iframe, rootEl) — held in state (not a ref) so reading
  // it during render to pass down as a prop is safe, and consumers
  // naturally re-render once a fresh one loads. See VersionPreview's
  // onIframeReady, fired from the iframe's own onLoad.
  const [inspectIframe, setInspectIframe] = useState(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Escape clears the current inspector selection — SaveComponentDialog
  // handles its own Escape (to close) while it's open, so skip here to
  // avoid clearing the selection out from under an open dialog.
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== 'Escape' || saveDialogOpen || !selection) return
      setSelection(null)
      setHoverSelector(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveDialogOpen, selection])

  // Discard the user's manual selection when navigating to a different
  // project (adjusted during render rather than in an effect — see
  // react.dev "Adjusting state when a prop changes").
  const routeKey = `${owner}/${repo}`
  const [loadedRouteKey, setLoadedRouteKey] = useState(routeKey)
  if (routeKey !== loadedRouteKey) {
    setLoadedRouteKey(routeKey)
    setSelectedVersionIdOverride(null)
    setVersions([])
    setVersionDetail(null)
    setLoadingVersions(true)
    setSelection(null)
    setHoverSelector(null)
  }

  useEffect(() => {
    let alive = true
    api
      .listVersions(owner, repo)
      .then((data) => alive && setVersions(data.versions))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoadingVersions(false))
    return () => { alive = false }
  }, [owner, repo])

  // No selection yet → default to the newest version once the list loads.
  const selectedVersionId = selectedVersionIdOverride ?? versions[0]?.id ?? null

  // Same render-time adjustment for the detail fetch, keyed off the
  // resolved selection rather than a route param.
  const [loadedVersionId, setLoadedVersionId] = useState(selectedVersionId)
  if (selectedVersionId !== loadedVersionId) {
    setLoadedVersionId(selectedVersionId)
    setVersionDetail(null)
    setLoadingDetail(!!selectedVersionId)
    setSelection(null)
    setHoverSelector(null)
  }

  useEffect(() => {
    if (!selectedVersionId) return
    let alive = true
    api
      .getVersion(owner, repo, selectedVersionId)
      .then((data) => alive && setVersionDetail(data))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoadingDetail(false))
    return () => { alive = false }
  }, [owner, repo, selectedVersionId])

  // A LayersPanel row click just updates the shared selection — the preview
  // highlights it in place in either mode (Auto Detect and Inspect both
  // render the selection overlay; only Inspect also wires up hover/click
  // hit-testing directly on the prototype).
  function handleLayersSelect(payload) {
    setSelection(payload)
  }

  // Generic entry point for saving whatever is currently selected — an
  // arbitrary inspected node doesn't have to be one of the pre-detected
  // components.
  function handleOpenSaveDialog() {
    if (selection) setSaveDialogOpen(true)
  }

  async function handleConfirmSave({ name, type, html, css, capturedWidth, lineageId }) {
    const matchedComponentId = selection?.matchedComponentId || undefined
    await api.saveComponent({
      component: { id: matchedComponentId, name, type, html, css, capturedWidth, selector: selection?.selector },
      sourceProject: `${owner}/${repo}`,
      sourceVersionId: selectedVersionId,
      lineageId,
    })
    if (matchedComponentId) {
      setVersionDetail((prev) => ({
        ...prev,
        components: prev.components.map((c) => (c.id === matchedComponentId ? { ...c, saved: true } : c)),
      }))
    }
    setSaveDialogOpen(false)
    setToast('Added to library')
  }

  const version = versionDetail?.version || null
  const components = versionDetail?.components || []
  const matchedComponentForSave = selection
    ? components.find((c) => c.id === selection.matchedComponentId) || null
    : null

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-ink-3">
          <Link to="/dashboard" className="hover:text-ink">Projects</Link>
          <span>/</span>
          <span className="font-medium text-ink">{owner}/{repo}</span>
        </div>
        <Link to="/dashboard" className="text-sm text-ink-2 hover:text-ink">← Back to Dashboard</Link>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_320px]">
        <div className="h-[70vh] lg:h-[calc(100vh-180px)]">
          <VersionList
            versions={versions}
            selectedVersionId={selectedVersionId}
            onSelectVersion={setSelectedVersionIdOverride}
            isLoading={loadingVersions}
          />
        </div>

        <div className="h-[70vh] lg:h-[calc(100vh-180px)]">
          <VersionPreview
            version={version}
            isLoading={loadingVersions || (loadingDetail && !version)}
            components={components}
            mode={previewMode}
            onModeChange={setPreviewMode}
            selection={selection}
            hoverSelector={hoverSelector}
            onSelect={setSelection}
            onIframeReady={setInspectIframe}
            onRequestSave={handleOpenSaveDialog}
          />
        </div>

        <div className="flex h-[70vh] min-h-0 flex-col gap-4 lg:h-[calc(100vh-180px)]">
          <div className="flex-1 min-h-0">
            {version ? (
              <LayersPanel
                key={version.id}
                version={version}
                mode={previewMode}
                components={components}
                selection={selection}
                onSelect={handleLayersSelect}
                onHover={setHoverSelector}
              />
            ) : (
              <div className="h-full animate-pulse rounded-[14px] bg-canvas" />
            )}
          </div>
        </div>
      </div>

      <SaveComponentDialog
        key={selection?.selector}
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleConfirmSave}
        iframe={inspectIframe}
        rootSelector={selection?.selector}
        matchedComponent={matchedComponentForSave}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-soft)]">
          {toast}
        </div>
      )}
    </div>
  )
}
