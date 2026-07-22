// Component-boundary heuristics shared by the live inspector (VersionPreview)
// and the layers tree (LayersPanel). Mirrors backend/utils/extractComponents.js
// so both snap to the same kind of boundaries the (server-side, cheerio-based)
// detector would pick — just walking a real DOM instead of a cheerio tree.

const SEMANTIC_TAGS = new Set(['header', 'nav', 'main', 'section', 'aside', 'article', 'footer', 'form'])
const GENERIC_WORDS = new Set(['app', 'root', 'wrap', 'wrapper', 'container', 'content', 'page', 'body'])

export function firstClass(el) {
  const cls = typeof el.className === 'string' ? el.className : ''
  return cls.split(/\s+/).find(Boolean) || null
}

function hasNonGenericId(el) {
  const id = el.id || ''
  return !!id && !GENERIC_WORDS.has(id.toLowerCase())
}

function hasComponentClass(el) {
  const cls = typeof el.className === 'string' ? el.className : ''
  return cls.split(/\s+/).some((c) => c.includes('-') && c.length > 4)
}

// Semantic tags are always a good boundary; otherwise a non-generic id or a
// BEM/component-style class (hyphenated, >4 chars) makes the element one.
export function isGoodBoundary(el) {
  if (!el || !el.tagName) return false
  if (SEMANTIC_TAGS.has(el.tagName.toLowerCase())) return true
  return hasNonGenericId(el) || hasComponentClass(el)
}

// id > class > tag, matching backend's buildName/buildSelector convention.
export function labelFor(el) {
  if (el.id) return `#${el.id}`
  const cls = firstClass(el)
  if (cls) return `.${cls}`
  return el.tagName.toLowerCase()
}

export function hoverLabelFor(el) {
  const tag = el.tagName.toLowerCase()
  if (el.id) return `${tag}#${el.id}`
  const cls = firstClass(el)
  if (cls) return `${tag}.${cls}`
  return tag
}

// Robust fallback selector when the boundary isn't a known detected
// component: id shortcut, else an nth-of-type path from the document root.
export function computeRobustSelector(el, doc) {
  if (el.id) return `#${el.id}`
  const parts = []
  let node = el
  while (node && node.nodeType === 1 && node !== doc.documentElement) {
    if (node.id) {
      parts.unshift(`#${node.id}`)
      break
    }
    const parent = node.parentElement
    if (!parent) {
      parts.unshift(node.tagName.toLowerCase())
      break
    }
    const siblingsOfType = Array.from(parent.children).filter((c) => c.tagName === node.tagName)
    const tag = node.tagName.toLowerCase()
    parts.unshift(siblingsOfType.length > 1 ? `${tag}:nth-of-type(${siblingsOfType.indexOf(node) + 1})` : tag)
    node = parent
  }
  return parts.join(' > ')
}

// Resolves each detected component's selector to a live node in `doc`, keyed
// by node identity — lets callers snap to a known component by reference.
export function resolveComponentNodes(doc, components) {
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
