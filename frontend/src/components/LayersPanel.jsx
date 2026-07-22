import { useEffect, useMemo, useRef, useState } from 'react'
import { isGoodBoundary, hoverLabelFor, computeRobustSelector } from '../lib/inspectorHeuristics.js'
import { tagTone } from '../lib/gradients.js'

function buildComponentMap(doc, components) {
  const map = new Map()
  for (const c of components) {
    if (!c.selector) continue
    try {
      const node = doc.querySelector(c.selector)
      if (node) map.set(node, c)
    } catch {
      // Selector from mock data didn't parse — ignore, generic heuristics still apply.
    }
  }
  return map
}

// Recursively collects the "meaningful" children under `el`, flattening past
// trivial wrappers so their meaningful descendants surface at this level —
// e.g. a plain <div class="plans"> wrapping cards contributes no row of its
// own, but its .pricing-card children still show up directly here.
function collectChildren(el, doc, componentMap) {
  const result = []
  for (const child of Array.from(el.children)) {
    const matched = componentMap.get(child) || null
    if (matched || isGoodBoundary(child)) {
      result.push({
        selector: matched?.selector || computeRobustSelector(child, doc),
        tag: child.tagName.toLowerCase(),
        label: matched?.name || hoverLabelFor(child),
        type: matched?.type || null,
        matchedComponentId: matched?.id || null,
        outerHTML: child.outerHTML,
        children: collectChildren(child, doc, componentMap),
      })
    } else {
      result.push(...collectChildren(child, doc, componentMap))
    }
  }
  return result
}

function buildTree(snapshotHtml, components) {
  const doc = new DOMParser().parseFromString(snapshotHtml, 'text/html')
  const componentMap = buildComponentMap(doc, components)
  return {
    selector: 'body',
    tag: 'body',
    label: 'body',
    type: null,
    matchedComponentId: null,
    outerHTML: '',
    children: collectChildren(doc.body, doc, componentMap),
  }
}

// Flattens the tree into selector -> node and selector -> ancestor-chain
// lookups, so an externally-driven selection can find, expand, and scroll
// to the right row without walking the tree again.
function indexTree(root) {
  const bySelector = new Map()
  const ancestorsOf = new Map()
  function walk(node, ancestors) {
    bySelector.set(node.selector, node)
    ancestorsOf.set(node.selector, ancestors)
    for (const child of node.children) walk(child, [...ancestors, node.selector])
  }
  walk(root, [])
  return { bySelector, ancestorsOf }
}

// Every detected-component row in the tree, in document order, each
// stripped of its own children — used for the "Detected only" view, which
// is meant to read as a flat components list (like the old sidebar list),
// not a nested tree.
function collectDetected(root) {
  const result = []
  function walk(node) {
    if (node.matchedComponentId) result.push({ ...node, children: [] })
    for (const child of node.children) walk(child)
  }
  walk(root)
  return result
}

function Row({ node, depth, expanded, activeSelector, onToggle, onSelect, onHover, rowRefs }) {
  const hasChildren = node.children.length > 0
  const isOpen = expanded.has(node.selector)
  const isActive = activeSelector === node.selector

  return (
    <div>
      <div
        ref={(el) => {
          if (el) rowRefs.current.set(node.selector, el)
          else rowRefs.current.delete(node.selector)
        }}
        onMouseEnter={() => onHover(node.selector)}
        onMouseLeave={() => onHover(null)}
        onClick={() => onSelect(node)}
        className={`flex min-w-0 cursor-pointer items-center gap-1.5 rounded py-1 pr-1.5 text-xs ${
          isActive ? 'bg-ink text-white' : 'text-ink-2 hover:bg-canvas'
        }`}
        style={{ paddingLeft: 6 + depth * 14 }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node.selector)
            }}
            className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center ${isActive ? 'text-white' : 'text-ink-3'}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className={`h-2.5 w-2.5 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ) : (
          <span className="h-3.5 w-3.5 shrink-0" />
        )}
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-mono uppercase ${
            isActive ? 'bg-white/20 text-white' : 'bg-canvas text-ink-3'
          }`}
        >
          {node.tag.slice(0, 2)}
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1 font-mono">
          {node.matchedComponentId && (
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? 'bg-white' : 'bg-babyblue-ink'}`}
              title="Detected component"
            />
          )}
          <span className="min-w-0 truncate">{node.label}</span>
        </span>
        {node.type && (
          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${tagTone(node.type)}`}>
            {node.type}
          </span>
        )}
      </div>
      {hasChildren && isOpen && (
        <div>
          {node.children.map((child) => (
            <Row
              key={child.selector}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              activeSelector={activeSelector}
              onToggle={onToggle}
              onSelect={onSelect}
              onHover={onHover}
              rowRefs={rowRefs}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Devtools/Figma-style layers tree for the current version's snapshot — an
// alternative, precise way to select "the card, not just its button". Built
// from a detached DOMParser document (not the live preview iframe), so it
// works regardless of Auto Detect/Inspect mode; selection is a plain
// selector string shared with VersionPreview via the parent, so both sides
// resolve it against their own DOM independently rather than sharing node
// refs. `mode` drives which view renders — Auto Detect shows only the flat
// detected-components list, Inspect shows the full nested tree — rather
// than a separate "Detected only" toggle living here on top of that.
export default function LayersPanel({ version, mode, components, selection, onSelect, onHover }) {
  const tree = useMemo(() => buildTree(version.snapshotHtml, components), [version.snapshotHtml, components])
  const { bySelector, ancestorsOf } = useMemo(() => indexTree(tree), [tree])
  const detectedNodes = useMemo(() => collectDetected(tree), [tree])
  const rowRefs = useRef(new Map())
  const detectedOnly = mode === 'auto'

  // Reset default expansion (fully open — these trees are small) whenever
  // the tree itself changes, i.e. a different version.
  const [expandedForVersion, setExpandedForVersion] = useState(version.id)
  const [expanded, setExpanded] = useState(() => new Set(bySelector.keys()))
  if (version.id !== expandedForVersion) {
    setExpandedForVersion(version.id)
    setExpanded(new Set(bySelector.keys()))
  }

  // External selection (e.g. a click inside the preview iframe) — expand its
  // ancestors so the row becomes visible. Pure derived state from the
  // `selection` prop, so — like the expansion reset above — this happens
  // during render (react.dev "Adjusting state when a prop changes") rather
  // than in an effect; the scroll-into-view below it, which is a genuine
  // imperative DOM action, stays in a real effect.
  const [expandedForSelection, setExpandedForSelection] = useState(undefined)
  if (selection !== expandedForSelection) {
    setExpandedForSelection(selection)
    if (selection?.selector && ancestorsOf.has(selection.selector)) {
      const ancestors = ancestorsOf.get(selection.selector)
      const next = new Set(expanded)
      let changed = false
      for (const a of ancestors) {
        if (!next.has(a)) {
          next.add(a)
          changed = true
        }
      }
      if (changed) setExpanded(next)
    }
  }

  // Once expanded/rendered, scroll the active row into view.
  useEffect(() => {
    if (!selection?.selector) return
    rowRefs.current.get(selection.selector)?.scrollIntoView({ block: 'nearest' })
  }, [selection, expanded])

  function toggle(selector) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(selector)) next.delete(selector)
      else next.add(selector)
      return next
    })
  }

  function handleSelect(node) {
    onSelect?.({
      tag: node.tag,
      selector: node.selector,
      label: node.label,
      matchedComponentId: node.matchedComponentId,
      outerHTML: node.outerHTML,
    })
  }

  return (
    <div className="flex h-full flex-col rounded-[14px] border border-border bg-surface shadow-[var(--shadow-soft)]">
      <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink-3">
        {detectedOnly ? `${detectedNodes.length} detected components` : `Layers · ${detectedNodes.length} detected`}
      </div>
      <div className="flex-1 overflow-y-auto p-1.5" onMouseLeave={() => onHover?.(null)}>
        {detectedOnly ? (
          detectedNodes.length === 0 ? (
            <p className="px-1.5 py-2 text-xs text-ink-3">No detected components in this version.</p>
          ) : (
            detectedNodes.map((node) => (
              <Row
                key={node.selector}
                node={node}
                depth={0}
                expanded={expanded}
                activeSelector={selection?.selector ?? null}
                onToggle={toggle}
                onSelect={handleSelect}
                onHover={(sel) => onHover?.(sel)}
                rowRefs={rowRefs}
              />
            ))
          )
        ) : (
          <Row
            node={tree}
            depth={0}
            expanded={expanded}
            activeSelector={selection?.selector ?? null}
            onToggle={toggle}
            onSelect={handleSelect}
            onHover={(sel) => onHover?.(sel)}
            rowRefs={rowRefs}
          />
        )}
      </div>
    </div>
  )
}
