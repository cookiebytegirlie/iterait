import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { isGoodBoundary, labelFor, hoverLabelFor, computeRobustSelector, resolveComponentNodes } from '../lib/inspectorHeuristics.js'

// Snapshots always render at this intrinsic desktop width, then get scaled
// (via CSS transform, uniformly so nothing distorts) to fit whatever the
// center column's actual pixel width happens to be. This keeps every
// version's media queries/breakpoints resolving the same way regardless of
// viewport, instead of each one rendering at a different, cramped ~500-600px.
const CANONICAL_WIDTH = 1280

function timeAgo(date) {
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

// --- Inspector -----------------------------------------------------------
// Renders the snapshot in a same-origin (but scriptless) sandboxed iframe
// and, from the parent, hit-tests the iframe's DOM on hover/click to draw a
// devtools-style highlight and climb to component-shaped boundaries.
//
// Selection/hover are semi-controlled: clicks/hovers *inside the iframe*
// resolve locally and notify the parent via onSelect; an incoming
// `selection`/`hoverSelector` prop (e.g. from LayersPanel) is mirrored back
// onto this same overlay without re-notifying the parent, so both directions
// stay in sync without an update loop.
function InspectorFrame({ version, mode, components, selection, hoverSelector, onSelect, onIframeReady, onRequestSave }) {
  const wrapperRef = useRef(null)
  const iframeRef = useRef(null)
  const componentNodesRef = useRef(new Map())
  const [loaded, setLoaded] = useState(false)
  const [hover, setHover] = useState(null) // { rect, label }
  const [selectionBox, setSelectionBox] = useState(null) // { rect, breadcrumb }

  // The wrapper's own box is sized purely by flexbox (the iframe inside it
  // is absolutely positioned, so it never feeds back into this) — measured
  // via ResizeObserver so the canonical-width iframe always scales to fill
  // whatever space is actually available, including on window resize.
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 })
  const scale = wrapperSize.width > 0 ? wrapperSize.width / CANONICAL_WIDTH : 1
  const canonicalHeight = wrapperSize.height > 0 ? wrapperSize.height / scale : CANONICAL_WIDTH * 0.75

  // Mirrored into a ref so toOverlayRect (called from event-handler closures
  // registered by an effect that intentionally doesn't depend on `scale` —
  // see the mousemove/click effect below) always reads the current scale
  // instead of whatever was captured when that effect last ran.
  const scaleRef = useRef(scale)
  useEffect(() => {
    scaleRef.current = scale
  }, [scale])

  useLayoutEffect(() => {
    const wrapperEl = wrapperRef.current
    if (!wrapperEl) return
    // Synchronous first measurement (before paint) so the very first frame
    // already has the right scale — the ResizeObserver callback below is
    // async and would otherwise show one frame at the fallback scale.
    const rect = wrapperEl.getBoundingClientRect()
    setWrapperSize({ width: rect.width, height: rect.height })
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setWrapperSize({ width, height })
    })
    observer.observe(wrapperEl)
    return () => observer.disconnect()
  }, [])

  function getDoc() {
    return iframeRef.current?.contentDocument || null
  }

  // Convert an element's (iframe-relative) rect into a rect positioned
  // absolutely within `wrapperRef` — the box is drawn in the PARENT, the
  // snapshot DOM itself is never touched.
  //
  // The iframe itself is CSS-transformed (scale(...)) from the outside, so
  // its own getBoundingClientRect() already reflects that (transforms are
  // paint-time but getBoundingClientRect accounts for them). Elements
  // *inside* the iframe are measured by the iframe's own layout engine,
  // which has no idea it's being scaled — el.getBoundingClientRect() comes
  // back in the iframe's unscaled canonical-width coordinate space. Same
  // for iframeEl.clientLeft/clientTop (border thickness): those reflect the
  // iframe's own pre-transform layout box, not painted size. So everything
  // measured in that unscaled space — border offset and element rect alike
  // — has to be multiplied by the same scale factor before it's added to
  // the (already-scaled) iframe position to land in the wrapper's space.
  function toOverlayRect(el) {
    const iframeEl = iframeRef.current
    const wrapperEl = wrapperRef.current
    if (!iframeEl || !wrapperEl || !el) return null
    const s = scaleRef.current
    const iframeRect = iframeEl.getBoundingClientRect()
    const wrapperRect = wrapperEl.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    return {
      left: iframeRect.left + (iframeEl.clientLeft + elRect.left) * s - wrapperRect.left,
      top: iframeRect.top + (iframeEl.clientTop + elRect.top) * s - wrapperRect.top,
      width: elRect.width * s,
      height: elRect.height * s,
    }
  }

  function findBoundary(startEl, doc) {
    let node = startEl
    while (node && node !== doc.documentElement) {
      if (componentNodesRef.current.has(node) || isGoodBoundary(node)) return node
      node = node.parentElement
    }
    return startEl
  }

  function buildBreadcrumbChain(el, doc) {
    const chain = []
    let node = el
    while (node && node !== doc.documentElement) {
      if (node === el || isGoodBoundary(node)) chain.push(node)
      node = node.parentElement
    }
    return chain.reverse()
  }

  // Selects an already-resolved boundary node as-is (used by breadcrumb
  // clicks, which must re-root exactly to the crumb, not climb past it).
  // Internal-origin only: always notifies the parent via onSelect.
  function finalizeSelection(boundaryEl) {
    const doc = getDoc()
    if (!doc || !boundaryEl) return
    const matched = componentNodesRef.current.get(boundaryEl) || null
    const payload = {
      tag: boundaryEl.tagName.toLowerCase(),
      selector: matched?.selector || computeRobustSelector(boundaryEl, doc),
      label: labelFor(boundaryEl),
      matchedComponentId: matched?.id || null,
      outerHTML: boundaryEl.outerHTML,
    }
    setSelectionBox({
      rect: toOverlayRect(boundaryEl),
      breadcrumb: buildBreadcrumbChain(boundaryEl, doc).map((n) => ({ label: labelFor(n), node: n })),
    })
    setHover(null)
    onSelect?.(payload)
  }

  // Selects from a raw hit-tested element, climbing to the nearest good
  // boundary (or a known detected-component node) first.
  function selectElement(rawEl) {
    const doc = getDoc()
    if (!doc || !rawEl) return
    finalizeSelection(findBoundary(rawEl, doc))
  }

  // Resolve the version's detected-component selectors to live nodes once,
  // so climbing can snap to them by identity.
  useEffect(() => {
    if (!loaded || mode !== 'inspect') return
    const doc = getDoc()
    if (!doc) return
    componentNodesRef.current = resolveComponentNodes(doc, components)
  }, [loaded, mode, components])

  // Hover/click wiring directly on the iframe's own document.
  useEffect(() => {
    if (!loaded || mode !== 'inspect') return
    const doc = getDoc()
    if (!doc) return

    function handleMouseMove(e) {
      const el = doc.elementFromPoint(e.clientX, e.clientY)
      if (!el || el === doc.documentElement || el === doc.body) {
        setHover(null)
        return
      }
      setHover({ rect: toOverlayRect(el), label: hoverLabelFor(el) })
    }
    function handleMouseLeave() {
      setHover(null)
    }
    function handleClick(e) {
      e.preventDefault()
      e.stopPropagation()
      const el = doc.elementFromPoint(e.clientX, e.clientY)
      if (el) selectElement(el)
    }

    doc.addEventListener('mousemove', handleMouseMove)
    doc.addEventListener('mouseleave', handleMouseLeave)
    doc.addEventListener('click', handleClick, true)
    return () => {
      doc.removeEventListener('mousemove', handleMouseMove)
      doc.removeEventListener('mouseleave', handleMouseLeave)
      doc.removeEventListener('click', handleClick, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, mode])

  // External hover (e.g. a LayersPanel row) — mirrored onto the same box,
  // including clearing it when the external hover ends (hoverSelector back
  // to null) — the internal mouseleave handler above only knows about the
  // iframe's own document, not LayersPanel's rows. Reading the iframe's DOM
  // has to happen in an effect (refs aren't safe to read during render);
  // the setState is deferred a tick so it isn't a bare synchronous call in
  // the effect body, same shape as the real external-subscription effect.
  // Runs in both modes — Auto Detect's whole point is a LayersPanel row
  // driving this highlight, not just Inspect's own hit-testing.
  useEffect(() => {
    if (!loaded) return
    if (!hoverSelector) {
      queueMicrotask(() => setHover(null))
      return
    }
    const doc = getDoc()
    if (!doc) return
    let node = null
    try { node = doc.querySelector(hoverSelector) } catch { /* ignore */ }
    if (!node) return
    const next = { rect: toOverlayRect(node), label: hoverLabelFor(node) }
    queueMicrotask(() => setHover(next))
  }, [loaded, hoverSelector])

  // External selection (e.g. a LayersPanel row click) — mirror it onto the
  // same box/breadcrumb without re-notifying the parent (avoids a loop).
  // Runs in both modes, same reasoning as the hover effect above.
  useEffect(() => {
    if (!loaded) return
    const doc = getDoc()
    if (!doc) return
    if (!selection?.selector) {
      queueMicrotask(() => setSelectionBox(null))
      return
    }
    let node = null
    try { node = doc.querySelector(selection.selector) } catch { /* ignore */ }
    if (!node) return
    const next = {
      rect: toOverlayRect(node),
      breadcrumb: buildBreadcrumbChain(node, doc).map((n) => ({ label: labelFor(n), node: n })),
    }
    queueMicrotask(() => setSelectionBox(next))
  }, [loaded, selection])

  return (
    <div className="flex h-full flex-col gap-2">
      <div ref={wrapperRef} className="relative min-h-0 flex-1 overflow-hidden">
        <iframe
          ref={iframeRef}
          sandbox="allow-same-origin"
          srcDoc={version.snapshotHtml}
          onLoad={() => {
            setLoaded(true)
            onIframeReady?.(iframeRef.current)
          }}
          className="absolute left-0 top-0 origin-top-left rounded-[14px] border border-border bg-surface"
          style={{ width: CANONICAL_WIDTH, height: canonicalHeight, transform: `scale(${scale})` }}
          title={`${version.label} preview`}
        />

        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded-sm border-2 border-babyblue-ink bg-babyblue-ink/10"
            style={{ left: hover.rect.left, top: hover.rect.top, width: hover.rect.width, height: hover.rect.height }}
          >
            <span className="absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium text-white bg-babyblue-ink">
              {hover.label}
            </span>
          </div>
        )}

        {selectionBox && (
          <div
            className="pointer-events-none absolute z-20 rounded-sm border-2 border-ink"
            style={{ left: selectionBox.rect.left, top: selectionBox.rect.top, width: selectionBox.rect.width, height: selectionBox.rect.height }}
          >
            <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] font-medium text-white">
              Selected
            </span>
          </div>
        )}
      </div>

      {/* Selection action bar: the primary "select a node → save it" path,
          anchored to the bottom of the preview instead of buried in a side
          panel. Breadcrumb (left) re-roots the selection via
          finalizeSelection; persists in a muted/disabled state with nothing
          selected so it reads as "the place capture happens" rather than
          something that pops in and out. Shown in both modes — Auto Detect
          selects via the layers panel, Inspect via hover/click here, but
          either way this is where you save. */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 shadow-[var(--shadow-soft)]">
        {selectionBox ? (
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-xs">
            {selectionBox.breadcrumb.map((crumb, i) => (
              <span key={i} className="flex shrink-0 items-center gap-1">
                {i > 0 && <span className="text-ink-3">›</span>}
                <button
                  onClick={() => finalizeSelection(crumb.node)}
                  className="rounded px-1.5 py-0.5 font-mono text-ink-2 hover:bg-canvas hover:text-ink"
                >
                  {crumb.label}
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="min-w-0 flex-1 truncate text-xs text-ink-3">
            {mode === 'inspect' ? 'Click a component to select it' : 'Select a component in the layers panel'}
          </span>
        )}
        <button
          onClick={() => onRequestSave?.()}
          disabled={!selectionBox}
          className="shrink-0 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save component
        </button>
      </div>
    </div>
  )
}

// Center panel: the selected version rendered as an interactive prototype,
// with a devtools-style inspector for hovering/selecting nodes inside it.
// snapshotHtml comes from detected commit content, so it's untrusted — the
// iframe always runs sandbox="allow-same-origin" (never allow-scripts, so
// the untrusted page's own scripts, if any, still never execute) so the
// PARENT can read/highlight elements in either mode:
//   - 'auto' (Auto Detect): selection is driven entirely by LayersPanel —
//     click a detected row there and it highlights here. No hover/click
//     hit-testing runs directly on the prototype.
//   - 'inspect': the classic hover-to-highlight, click-to-select flow runs
//     directly on the prototype, in addition to still mirroring LayersPanel
//     selections.
//
// `mode`, `selection` and `hoverSelector` are lifted to the parent (Versions
// page) so LayersPanel can share one selection with this preview.
export default function VersionPreview({
  version,
  isLoading,
  components = [],
  mode = 'auto',
  onModeChange,
  selection,
  hoverSelector,
  onSelect,
  onIframeReady,
  onRequestSave,
}) {
  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-3">
        <div className="h-5 w-1/3 animate-pulse rounded bg-canvas" />
        <div className="flex-1 animate-pulse rounded-[14px] bg-canvas" />
      </div>
    )
  }

  if (!version) {
    return (
      <div className="flex h-full items-center justify-center rounded-[14px] border border-border bg-surface p-6 text-sm text-ink-3 shadow-[var(--shadow-soft)]">
        Select a version to preview.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-ink">{version.label}</h2>
          <p className="mt-1 text-sm text-ink-2">{version.author} · {timeAgo(version.createdAt)}</p>
        </div>
        <div className="flex shrink-0 rounded-full border border-border p-0.5 text-xs font-medium">
          <button
            onClick={() => onModeChange?.('auto')}
            className={`rounded-full px-3 py-1 transition-colors ${mode === 'auto' ? 'bg-ink text-white' : 'text-ink-2 hover:bg-canvas'}`}
          >
            Auto Detect
          </button>
          <button
            onClick={() => onModeChange?.('inspect')}
            className={`rounded-full px-3 py-1 transition-colors ${mode === 'inspect' ? 'bg-ink text-white' : 'text-ink-2 hover:bg-canvas'}`}
          >
            Inspect
          </button>
        </div>
      </div>

      <p className="-mt-1 text-xs text-ink-3">
        {mode === 'inspect'
          ? 'Hover the prototype and click a component to select it.'
          : 'Click a detected component in the layers panel to highlight it here.'}
      </p>

      <InspectorFrame
        key={version.id}
        version={version}
        mode={mode}
        components={components}
        selection={selection}
        hoverSelector={hoverSelector}
        onSelect={onSelect}
        onIframeReady={onIframeReady}
        onRequestSave={onRequestSave}
      />
    </div>
  )
}
