// Pure client-side "capture" utility: given a live node inside a sandboxed
// snapshot iframe, walks the iframe's real CSSOM (iframe.contentWindow.
// document.styleSheets) and pulls out every rule that actually targets the
// selected subtree — including :hover/:focus states, ::before/::after,
// @media breakpoints, and @keyframes — so the extracted fragment keeps
// behaving like a real component instead of a flattened screenshot.
//
// Computed-style inlining is only a last-resort fallback (see
// computedStyleFallback below), never the primary path: it bakes in
// whatever state happened to be active at capture time and loses
// hover/focus/animation entirely.
//
// NOTE on realms: rule objects here live in the IFRAME's JS realm, not this
// module's. `instanceof CSSMediaRule` etc. would silently fail (cross-realm
// instanceof always fails, same-origin or not — each browsing context gets
// its own copy of every built-in constructor). We compare `.constructor.name`
// strings instead, which are stable across realms.

const PSEUDO_ELEMENT_RE = /::?(before|after|placeholder|selection|marker|first-line|first-letter|backdrop|file-selector-button)\b/gi

const STATE_PSEUDO_CLASS_RE =
  /:(hover|focus-visible|focus-within|focus|active|visited|target-within|target|disabled|enabled|checked|indeterminate|invalid|valid|required|optional|read-only|read-write|placeholder-shown|default|in-range|out-of-range|user-invalid|autofill)\b/gi

const GROUPING_RULE_TYPES = new Set(['CSSMediaRule', 'CSSSupportsRule', 'CSSContainerRule'])

function ruleTypeName(rule) {
  return rule?.constructor?.name || ''
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Removes pseudo-elements and user/browser-state pseudo-classes from a
// selector so it becomes something `Element.matches()` can safely evaluate
// against a static snapshot. The ORIGINAL selector (with these intact) is
// still what gets emitted in the output CSS — stripping is only for the
// match test, so a rule like `.btn:hover` is kept in full once `.btn`
// itself is found to apply to the subtree.
function stripDynamicPseudos(selectorText) {
  const stripped = (selectorText || '').replace(PSEUDO_ELEMENT_RE, '').replace(STATE_PSEUDO_CLASS_RE, '')
  return stripped.split(',').map((part) => part.trim()).filter(Boolean).join(', ')
}

function isRootSelector(selectorText) {
  return (selectorText || '').split(',').some((part) => part.trim() === ':root')
}

function selectorMatchesSubtree(selector, rootEl, subtreeNodes) {
  if (!selector) return false
  try {
    if (rootEl.matches(selector)) return true
    return subtreeNodes.some((el) => el.matches(selector))
  } catch {
    return false // selector became invalid after stripping (e.g. :not(:hover) -> :not()) — skip, don't crash the scan
  }
}

// Grouping at-rules (@media/@supports/@container) re-serialize as their own
// header (taken verbatim from the rule's own cssText, before its first `{`)
// wrapped around only the inner rules we actually kept — not the original
// block's untouched siblings.
function wrapGroupingRule(rule, innerCssTexts) {
  const header = rule.cssText.slice(0, rule.cssText.indexOf('{')).trim()
  return `${header} { ${innerCssTexts.join(' ')} }`
}

// Walks one rule list (a stylesheet's top-level rules, or a grouping rule's
// inner rules) collecting matches into `ctx`. Top-level style-rule matches
// go straight into ctx.baseBlocks; matches found while recursing into a
// grouping rule are returned so the caller can wrap them in that rule's
// @media/@supports/@container header instead.
function processRuleList(cssRules, ctx, isTopLevel) {
  const localKept = []
  for (const rule of Array.from(cssRules)) {
    const typeName = ruleTypeName(rule)

    if (typeName === 'CSSStyleRule') {
      if (isRootSelector(rule.selectorText)) {
        ctx.rootBlocks.push(rule.cssText)
        continue
      }
      const stripped = stripDynamicPseudos(rule.selectorText)
      if (selectorMatchesSubtree(stripped, ctx.rootEl, ctx.subtreeNodes)) {
        ctx.matchedCssTexts.push(rule.cssText)
        if (isTopLevel) ctx.baseBlocks.push(rule.cssText)
        else localKept.push(rule.cssText)
      }
      continue
    }

    if (GROUPING_RULE_TYPES.has(typeName)) {
      const innerKept = processRuleList(rule.cssRules, ctx, false)
      if (innerKept.length > 0) {
        const wrapped = wrapGroupingRule(rule, innerKept)
        ctx.matchedCssTexts.push(wrapped)
        if (typeName === 'CSSContainerRule') ctx.hasContainerQueries = true
        if (isTopLevel) ctx.mediaBlocks.push(wrapped)
        else localKept.push(wrapped)
      }
      continue
    }

    if (typeName === 'CSSKeyframesRule') {
      ctx.keyframesRules.push(rule)
      continue
    }

    if (typeName === 'CSSFontFaceRule') {
      ctx.fontFaceRules.push(rule)
    }
    // Other rule types (@import, @page, @namespace, ...) are out of scope.
  }
  return localKept
}

function fontFaceFamily(rule) {
  const value = rule.style?.getPropertyValue('font-family') || ''
  return value.replace(/^["']|["']$/g, '').trim()
}

// @keyframes/@font-face aren't selector-matched against the subtree — they're
// only relevant if a rule we already kept actually references them. Rather
// than parsing `animation`/`animation-name` shorthand values by hand, check
// whether each candidate name shows up as a whole word anywhere in the CSS
// text we're keeping; good enough for real-world component CSS.
function collectReferencedAuxRules(ctx) {
  const matchedText = ctx.matchedCssTexts.join(' ')
  const keyframes = ctx.keyframesRules
    .filter((kf) => kf.name && new RegExp(`\\b${escapeRegExp(kf.name)}\\b`).test(matchedText))
    .map((kf) => kf.cssText)
  const fontFaces = ctx.fontFaceRules
    .filter((ff) => {
      const family = fontFaceFamily(ff)
      return family && new RegExp(`\\b${escapeRegExp(family)}\\b`, 'i').test(matchedText)
    })
    .map((ff) => ff.cssText)
  return { keyframes, fontFaces }
}

// Last-resort fallback: bakes every computed property into inline `style`
// attributes on a clone of the subtree. Loses hover/focus/pseudo-elements/
// animation entirely, so this only runs when the primary CSSOM pass found
// nothing to keep (e.g. the snapshot has no accessible stylesheets at all).
function computedStyleFallback(doc, rootEl, subtreeNodes) {
  const win = doc.defaultView
  const clone = rootEl.cloneNode(true)
  const originalNodes = [rootEl, ...subtreeNodes]
  const cloneNodes = [clone, ...Array.from(clone.querySelectorAll('*'))]
  for (let i = 0; i < originalNodes.length && i < cloneNodes.length; i++) {
    const computed = win.getComputedStyle(originalNodes[i])
    const decls = []
    for (let j = 0; j < computed.length; j++) {
      const prop = computed[j]
      decls.push(`${prop}:${computed.getPropertyValue(prop)}`)
    }
    cloneNodes[i].setAttribute('style', decls.join(';'))
  }
  return { html: clone.outerHTML, css: '' }
}

function detectType(el) {
  const tag = el.tagName.toLowerCase()
  const role = (el.getAttribute('role') || '').toLowerCase()
  const cls = typeof el.className === 'string' ? el.className.toLowerCase() : ''

  if (tag === 'dialog' || role === 'dialog' || el.hasAttribute('aria-modal')) return 'modal'
  if (role === 'alert' || /\b(toast|popover|snackbar)\b/.test(cls)) return 'popup'
  if (tag === 'button' || role === 'button' || (tag === 'input' && /^(submit|button)$/.test(el.getAttribute('type') || ''))) return 'button'
  if (tag === 'nav' || role === 'navigation') return 'nav'
  if (tag === 'form') return 'form'
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return 'input'
  if (/\bcard\b/.test(cls)) return 'card'
  if (/\b(hero|banner)\b/.test(cls)) return 'hero'
  if (/\b(badge|chip)\b/.test(cls)) return 'badge'
  return 'other'
}

// TODO(real pipeline): rewrite url(...) references in `css` and <img>
// src/srcset attributes in `html` as data URIs, so a captured fragment is
// fully offline-portable even when the source snapshot links external
// assets. The v1 mock snapshots are entirely inline (no external assets),
// so this is a documented no-op for now — signature is here so the real
// asset pipeline has somewhere to plug in.
export function inlineAssets({ html, css }) {
  return { html, css }
}

// Extracts `rootEl` (plus its full subtree) out of the sandboxed snapshot
// iframe as a self-contained { html, css } pair that keeps hover/focus
// states, pseudo-elements, breakpoints, and animations intact.
export function extractComponent(iframe, rootEl) {
  const warnings = []
  const win = iframe.contentWindow
  const doc = win.document
  const subtreeNodes = Array.from(rootEl.querySelectorAll('*'))

  const ctx = {
    rootEl,
    subtreeNodes,
    rootBlocks: [],
    baseBlocks: [],
    mediaBlocks: [],
    keyframesRules: [],
    fontFaceRules: [],
    matchedCssTexts: [],
    hasContainerQueries: false,
  }

  for (const sheet of Array.from(doc.styleSheets)) {
    let rules
    try {
      rules = sheet.cssRules
    } catch {
      warnings.push(`Skipped cross-origin stylesheet${sheet.href ? `: ${sheet.href}` : ''}`)
      continue
    }
    if (!rules) continue
    processRuleList(rules, ctx, true)
  }

  const { keyframes, fontFaces } = collectReferencedAuxRules(ctx)

  let html = rootEl.outerHTML
  let css = [...ctx.rootBlocks, ...ctx.baseBlocks, ...ctx.mediaBlocks, ...keyframes, ...fontFaces].join('\n')

  if (ctx.baseBlocks.length === 0 && ctx.mediaBlocks.length === 0) {
    warnings.push('No matching CSS rules found in the snapshot’s stylesheets — falling back to computed-style inlining (hover/focus/animation will not survive).')
    const fallback = computedStyleFallback(doc, rootEl, subtreeNodes)
    html = fallback.html
    css = fallback.css
  }

  if (ctx.hasContainerQueries) {
    warnings.push('Captured rules include @container queries — layout may not render identically outside their original containment context.')
  }

  const inlined = inlineAssets({ html, css })

  return {
    html: inlined.html,
    css: inlined.css,
    type: detectType(rootEl),
    capturedWidth: win.innerWidth,
    hasContainerQueries: ctx.hasContainerQueries,
    warnings,
  }
}

// Wraps a captured { html, css } pair as a minimal standalone document,
// suitable for dropping straight into a sandbox="" preview iframe's srcDoc.
export function renderFragment({ html, css }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`
}
