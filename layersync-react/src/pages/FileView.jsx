import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import VersionSidebar from '../components/VersionSidebar'
import AnnotationDot from '../components/AnnotationDot'
import ChangeLogPanel from '../components/ChangeLogPanel'
import { generateChangeSummary } from '../utils/claudeApi'
import { captureBeforeAfter } from '../utils/captureSnapshot'
import CompanionPanel from '../components/CompanionPanel'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('iterait_api_token') || ''}` }
}

const CATEGORY_COLORS = { Visual:'#3B82F6', Layout:'#8B5CF6', Typography:'#F59E0B', Color:'#14B8A6' }

function loadVersions() {
  try { return JSON.parse(localStorage.getItem('iterait_versions') || '[]') } catch { return [] }
}
function saveVersions(v) { localStorage.setItem('iterait_versions', JSON.stringify(v)) }
function loadActions() {
  try { return JSON.parse(localStorage.getItem('iterait_actions') || '[]') } catch { return [] }
}
function saveActions(a) { localStorage.setItem('iterait_actions', JSON.stringify(a)) }
function loadChains() {
  try { return JSON.parse(localStorage.getItem('iterait_chains') || '[]') } catch { return [] }
}
function saveChains(c) { localStorage.setItem('iterait_chains', JSON.stringify(c)) }

export default function FileView() {
  const navigate = useNavigate()
  const [versions, setVersions]           = useState(loadVersions)
  const [currentVersionId, setCurrentVersionId] = useState(() => { const v = loadVersions(); return v.length ? v[v.length - 1].id : null })
  const [compareVersionId, setCompareVersionId] = useState(null)
  const [compareMode, setCompareMode]     = useState(false)
  const [activeChangeId, setActiveChangeId] = useState(null)
  const [selectedIds, setSelectedIds]     = useState([])
  const [scale, setScale]                 = useState(0.35)
  const [offset, setOffset]               = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning]         = useState(false)
  const [isDragging, setIsDragging]       = useState(false)
  const [dragStart, setDragStart]         = useState({ x: 0, y: 0 })
  const [isDragOver, setIsDragOver]       = useState(false)
  const [showCompanion, setShowCompanion] = useState(false)
  const [generating, setGenerating]       = useState(false)
  const [actionModal, setActionModal]     = useState(null)
  const [chainModal, setChainModal]       = useState(null)
  const [actionName, setActionName]         = useState('')
  const [chainName, setChainName]           = useState('')
  const [chainDescription, setChainDescription] = useState('')
  const [isSaving, setIsSaving]             = useState(false)
  const [iframeSrc, setIframeSrc]           = useState('')
  const iframeRef   = useRef(null)
  const fileInputRef = useRef(null)
  const canvasRef   = useRef(null)
  const panStart    = useRef(null)
  const scaleRef    = useRef(1)
  const offsetRef   = useRef({ x: 0, y: 0 })

  const currentVersion = versions.find(v => v.id === currentVersionId)
  const changes = currentVersion?.changes || []

  // Persist versions whenever they change
  useEffect(() => { saveVersions(versions) }, [versions])

  // Auto-select newest version
  useEffect(() => {
    if (!currentVersionId && versions.length) setCurrentVersionId(versions[versions.length - 1].id)
  }, [versions, currentVersionId])

  // Reset pan/zoom when version changes
  useEffect(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [currentVersionId])

  // Blob URL for iframe — renders full HTML correctly unlike srcDoc
  useEffect(() => {
    if (currentVersion?.htmlContent) {
      const disableAnimations = `
      <style>
        *, *::before, *::after {
          animation: none !important;
          animation-delay: 0s !important;
          animation-duration: 0s !important;
          transition: none !important;
          opacity: 1 !important;
          transform: none !important;
          visibility: visible !important;
        }
        [data-aos], [data-scroll], .hidden, .invisible {
          opacity: 1 !important;
          transform: none !important;
          visibility: visible !important;
        }
      </style>
    `
      const modifiedHtml = currentVersion.htmlContent.replace(
        '</head>',
        `${disableAnimations}</head>`
      )
      const blob = new Blob([modifiedHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      setIframeSrc(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [currentVersion?.htmlContent])

  function selectVersion(id) {
    setCurrentVersionId(id)
    setActiveChangeId(null)
    setSelectedIds([])
    setCompareMode(false)
    setCompareVersionId(null)
  }

  function handleVersionDelete(id) {
    setVersions(prev => {
      const next = prev.filter(v => v.id !== id)
      saveVersions(next)
      if (currentVersionId === id) {
        setCurrentVersionId(next.length ? next[next.length - 1].id : null)
      }
      return next
    })
  }

  // Sync refs so non-React listeners always see current values
  useEffect(() => { scaleRef.current = scale }, [scale])
  useEffect(() => { offsetRef.current = offset }, [offset])

  // Window-level pan — doesn't lose tracking when mouse moves fast
  useEffect(() => {
    if (!isPanning) return
    const onMove = (e) => setOffset({ x: panStart.current.ox + e.clientX - panStart.current.mx, y: panStart.current.oy + e.clientY - panStart.current.my })
    const onUp   = () => setIsPanning(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [isPanning])

  // Non-passive wheel — lets us call preventDefault() to stop page scroll + zoom toward cursor
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const handler = (e) => {
      e.preventDefault()
      const s = scaleRef.current
      const o = offsetRef.current
      const rect = el.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const delta = e.deltaY > 0 ? -0.05 : 0.05
      const ns = Math.min(Math.max(+(s + delta).toFixed(2), 0.25), 3)
      setScale(ns)
      setOffset({ x: cx - (ns / s) * (cx - o.x), y: cy - (ns / s) * (cy - o.y) })
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const onPanMouseDown = (e) => {
    if (e.button !== 0) return
    setIsPanning(true)
    panStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
  }
  const onWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.02 : 0.02
    setScale(prev => Math.min(Math.max(prev + delta, 0.1), 2))
  }
  const onMouseMove = (e) => {
    if (!isPanning) return
    setOffset({ x: panStart.current.ox + e.clientX - panStart.current.mx, y: panStart.current.oy + e.clientY - panStart.current.my })
  }
  const onMouseUp = () => setIsPanning(false)

  function handleVersionDrop() {}

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const html = await file.text()
    const prevVersion = versions.length ? versions[versions.length - 1] : null
    const newNumber = versions.length + 1
    const newId = `v${Date.now()}`

    window.__toast?.(`Processing version ${newNumber}…`)
    setGenerating(true)

    let changes = []
    let thumbnail = null

    // Generate thumbnail from iframe after brief render
    const tempIframe = document.createElement('iframe')
    tempIframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1200px;height:800px;opacity:0'
    tempIframe.srcdoc = html
    document.body.appendChild(tempIframe)

    await new Promise(r => { tempIframe.onload = r; setTimeout(r, 2000) })

    try {
      const canvas = await html2canvas(tempIframe.contentDocument.body, { scale: 0.25, useCORS: true, allowTaint: true })
      thumbnail = canvas.toDataURL('image/jpeg', 0.6)
    } catch (_) {}

    document.body.removeChild(tempIframe)

    if (prevVersion?.htmlContent) {
      try {
        changes = await generateChangeSummary(prevVersion.htmlContent, html)
        window.__toast?.(`${changes.length} changes detected`)
      } catch (err) {
        console.error('generateChangeSummary failed:', err)
        changes = []
      }
    }

    const newVer = {
      id: newId,
      number: newNumber,
      label: file.name.replace(/\.html?$/i, ''),
      timestamp: new Date().toLocaleString(),
      htmlContent: html,
      thumbnail,
      changes,
    }
    setVersions(prev => {
      const next = [...prev, newVer]
      saveVersions(next)
      return next
    })
    setCurrentVersionId(newId)
    setActiveChangeId(null)
    setSelectedIds([])
    setGenerating(false)
    window.__toast?.(`Version ${newNumber} saved`)
  }

  function toggleChangeSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleChangeSelect(id) {
    toggleChangeSelect(id)
    setActiveChangeId(id)
    const row = document.getElementById(`change-row-${id}`)
    row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  function handleDotClick(id) {
    setActiveChangeId(id)
    const row = document.getElementById(`change-row-${id}`)
    row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  // Canvas drag-to-compare
  function handleCanvasDragOver(e) {
    e.preventDefault()
    setIsDragOver(true)
  }
  function handleCanvasDragLeave() { setIsDragOver(false) }
  function handleCanvasDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const id = e.dataTransfer.getData('versionId')
    if (!id || id === currentVersionId) return
    setCompareVersionId(id)
    setCompareMode(true)
    const compVer = versions.find(v => v.id === id)
    const curVer  = versions.find(v => v.id === currentVersionId)
    window.__toast?.(`Comparing Version ${compVer?.number} vs Version ${curVer?.number}`)
    navigate('/file-view/side-by-side')
  }

  // Save as Action modal
  function openActionModal(changeId) {
    const c = changes.find(ch => ch.id === changeId)
    setActionName(c?.title || '')
    setActionModal({ changeId })
  }
  async function saveAction() {
    const c = changes.find(ch => ch.id === actionModal.changeId)
    if (!c) return
    setIsSaving(true)
    try {
      const previousVersion = versions[versions.indexOf(currentVersion) - 1] || null
      const position = c.approximatePosition ?? 30
      const { thumbnailBefore, thumbnailAfter } = previousVersion?.htmlContent && currentVersion?.htmlContent
        ? await captureBeforeAfter(previousVersion.htmlContent, currentVersion.htmlContent, position)
        : { thumbnailBefore: null, thumbnailAfter: null }
      const actions = loadActions()
      const newAction = {
        id: `act-${Date.now()}`,
        name: actionName || c.title,
        description: c.description,
        category: c.category,
        beforeValue: c.beforeValue,
        afterValue: c.afterValue,
        approximatePosition: position,
        thumbnailBefore,
        thumbnailAfter,
        platform: 'iterait',
        createdAt: new Date().toISOString(),
      }
      saveActions([...actions, newAction])
      window.__toast?.(`${newAction.name} saved to Action Library`)
      setActionModal(null)
    } finally {
      setIsSaving(false)
    }
  }

  // Save as Chain modal
  function openChainModal(changeIds) {
    setChainName('')
    setChainDescription('')
    setChainModal({ changeIds })
  }
  function saveChain() {
    const selectedChanges = changes.filter(c => chainModal.changeIds.includes(c.id))
    const previousVersion = versions[versions.indexOf(currentVersion) - 1] || null
    const chains = loadChains()
    const h1 = Math.floor(Math.random() * 360)
    const h2 = Math.floor(Math.random() * 360)
    const newChain = {
      id: crypto.randomUUID(),
      name: chainName || 'Untitled Chain',
      description: chainDescription.trim(),
      changes: selectedChanges,
      htmlBefore: previousVersion?.htmlContent || '',
      htmlAfter: currentVersion?.htmlContent || '',
      platform: currentVersion?.source || 'Unknown',
      sourceFile: currentVersion?.label || '',
      versionBefore: previousVersion?.label || 'Previous',
      versionAfter: currentVersion?.label || 'Current',
      createdAt: new Date().toISOString(),
      gradient: `linear-gradient(135deg, hsl(${h1},65%,72%), hsl(${h2},65%,72%))`,
    }
    saveChains([...chains, newChain])
    window.__toast?.(`"${newChain.name}" saved to Action Library`)
    setChainModal(null)
  }

  async function handleRestoreVersion(versionId) {
    try {
      const res = await fetch(`${BACKEND_URL}/versions/${versionId}/restore-full`, {
        method: 'POST',
        headers: authHeaders()
      })
      if (!res.ok) throw new Error('Restore failed')

      const restoredVersion = versions.find(v => v.id === versionId)
      if (restoredVersion) {
        const newVersion = {
          ...restoredVersion,
          id: crypto.randomUUID(),
          label: `Restored from ${restoredVersion.label}`,
          timestamp: new Date().toISOString(),
          changes: []
        }
        const updated = [newVersion, ...versions]
        saveVersions(updated)
        setVersions(updated)
        setCurrentVersionId(newVersion.id)
      }
      window.__toast?.(`Restored to ${restoredVersion?.label || 'previous version'}`)
    } catch (err) {
      console.error('Restore failed:', err)
      window.__toast?.('Restore failed — please try again')
    }
  }

  async function handleRestoreSelected() {
    const selectedChanges = changes.filter(c => selectedIds.includes(c.id))
    try {
      await Promise.all(
        selectedChanges
          .filter(c => c.componentId)
          .map(c =>
            fetch(`${BACKEND_URL}/versions/components/${c.componentId}/restore-partial`, {
              method: 'POST',
              headers: authHeaders()
            })
          )
      )

      const newVersion = {
        ...currentVersion,
        id: crypto.randomUUID(),
        label: `Partial restore — ${selectedChanges.length} change${selectedChanges.length !== 1 ? 's' : ''} reverted`,
        timestamp: new Date().toISOString(),
        changes: changes.filter(c => !selectedIds.includes(c.id))
      }
      const updated = [newVersion, ...versions]
      saveVersions(updated)
      setVersions(updated)
      setCurrentVersionId(newVersion.id)
      setSelectedIds([])
      window.__toast?.(`${selectedChanges.length} change${selectedChanges.length !== 1 ? 's' : ''} restored`)
    } catch (err) {
      console.error('Partial restore failed:', err)
      window.__toast?.('Restore failed — please try again')
    }
  }

  const activeChange = changes.find(c => c.id === activeChangeId)

  return (
    <main className="main-v2" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100vh' }}>
      {/* Topbar */}
      <header className="topbar-v2">
        <div className="left" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span onClick={() => navigate('/')} style={{ color: 'var(--text-3)', cursor: 'pointer', fontSize: '14px' }}>Home</span>
          <span style={{ color: 'var(--text-4)', fontSize: '14px' }}>/</span>
          <span style={{ fontSize: '14px', color: 'var(--text)' }}>Version History</span>
        </div>
        <div className="search-v2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input placeholder="Search..." />
        </div>
        <div className="right"><img src="/avatar-profile.jpg" alt="Profile" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', display: 'block', cursor: 'pointer', border: '2px solid #f0f0f0' }} /></div>
      </header>

      {/* Sub-topbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 20px', height: '52px', borderBottom: '1px solid var(--border)', background: '#fff', flexShrink: 0 }}>
        <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--text)', flex: 1 }}>
          {currentVersion ? `Version ${currentVersion.number}` : 'No versions yet'}
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>View</span>
        <button onClick={() => navigate('/file-view/side-by-side')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid #d1d5dc', borderRadius: '10px', fontSize: '13px', fontWeight: 500, color: 'var(--text)', cursor: 'pointer', background: '#fff', fontFamily: 'inherit' }}>
          Single (Default)
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {/* Zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={() => setScale(s => Math.max(+(s - 0.1).toFixed(2), 0.25))} style={zoomBtn}>−</button>
          <span style={{ fontSize: '12px', minWidth: '42px', textAlign: 'center', color: 'var(--text)', fontFamily: 'inherit' }}>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(+(s + 0.1).toFixed(2), 3))} style={zoomBtn}>+</button>
          <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }} style={{ ...zoomBtn, padding: '5px 10px', marginLeft: '2px' }}>Reset</button>
        </div>
        <button
          onClick={() => setShowCompanion(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid #e8e8e8', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <rect x="8" y="1" width="5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
          </svg>
          Companion
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={generating}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', background: '#1550E1', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: generating ? .7 : 1 }}>
          {generating ? 'Processing…' : '+ Upload HTML'}
        </button>
        <input ref={fileInputRef} type="file" accept=".html,.htm" style={{ display: 'none' }} onChange={handleFileUpload} />
      </div>

      {/* 3-column body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* Version sidebar */}
        <VersionSidebar
          versions={[...versions].reverse()}
          currentVersionId={currentVersionId}
          onVersionSelect={selectVersion}
          onVersionDelete={handleVersionDelete}
          onVersionDrop={handleVersionDrop}
        />

        {/* Canvas area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div
            ref={canvasRef}
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            onDrop={handleCanvasDrop}
            style={{ flex: 1, position: 'relative', overflow: 'visible', backgroundColor: '#F5F4F0', backgroundImage: 'radial-gradient(circle, #D0CEC8 1.5px, transparent 1.5px)', backgroundSize: '24px 24px', border: isDragOver ? '2px dashed rgba(59,130,246,0.5)' : '2px solid transparent', transition: 'border .2s' }}>

            {!currentVersion ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '14px', gap: '12px' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload an HTML file to get started
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none'
                }}
                onWheel={onWheel}
                onMouseDown={(e) => {
                  setIsDragging(true)
                  setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
                }}
                onMouseMove={(e) => {
                  if (!isDragging) return
                  setOffset({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                  })
                }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '20px',
                    paddingBottom: '120px',
                    transform: `translate(-50%, 0) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    transformOrigin: 'top center',
                    width: '1280px',
                    boxShadow: '0 4px 40px rgba(0,0,0,0.15)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginBottom: '120px',
                  }}
                >
                  <iframe
                    ref={iframeRef}
                    src={iframeSrc}
                    style={{ width: '1280px', height: '15000px', border: 'none', display: 'block', pointerEvents: isPanning ? 'none' : 'auto' }}
                    onLoad={(e) => {
                      try {
                        const doc = e.target.contentDocument
                        if (doc?.body) {
                          const h = Math.max(
                            doc.documentElement.scrollHeight,
                            doc.body.scrollHeight
                          )
                          if (h > 200) {
                            e.target.style.height = (h + 100) + 'px'
                          }
                        }
                      } catch(err) {}
                    }}
                  />
                </div>

                {/* Highlight band */}
                {activeChange && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: `${activeChange.approximatePosition - 9}%`, height: '18%', background: `${CATEGORY_COLORS[activeChange.category] || '#3B82F6'}14`, pointerEvents: 'none', transition: 'opacity .2s, top .2s', zIndex: 5 }} />
                )}

                {/* Annotation dots — above overlay so they stay clickable */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
                  {changes.map((c, i) => (
                    <AnnotationDot key={c.id} id={c.id} number={i+1} category={c.category} title={c.title} position={c.approximatePosition} isActive={c.id === activeChangeId} onClick={() => handleDotClick(c.id)} />
                  ))}
                </div>
              </div>
            )}

            {isDragOver && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(59,130,246,.9)', fontSize: '14px', fontWeight: 600, pointerEvents: 'none', zIndex: 20 }}>
                Drop to compare versions
              </div>
            )}
          </div>
        </div>

        {/* Change log panel */}
        <ChangeLogPanel
          changes={changes}
          selectedIds={selectedIds}
          onChangeSelect={handleChangeSelect}
          onSaveAction={openActionModal}
          onSaveChain={openChainModal}
          onRestore={handleRestoreSelected}
        />
      </div>

      {/* Save as Action modal */}
      {actionModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setActionModal(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.22)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '13px', width: '420px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,.14)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
              <div style={{ fontFamily: "'Instrument Sans',sans-serif", fontSize: '16px', fontWeight: 600, flex: 1 }}>Save as Action</div>
              <span onClick={() => setActionModal(null)} style={{ fontSize: '17px', color: 'var(--text-3)', cursor: 'pointer' }}>✕</span>
            </div>
            <div style={{ padding: '20px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Action name</label>
              <input value={actionName} onChange={e => setActionName(e.target.value)} placeholder="Action name…"
                style={{ width: '100%', background: '#f7f7f7', border: '1px solid var(--border)', borderRadius: '9px', padding: '10px 13px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', color: 'var(--text)' }} />
            </div>
            <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '7px', justifyContent: 'flex-end', alignItems: 'center' }}>
              {isSaving && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888', fontFamily: "'Instrument Sans', sans-serif", marginRight: 'auto' }}>
                  <div style={{ width: 14, height: 14, border: '2px solid #e8e8e8', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  Capturing snapshot...
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}
              <button onClick={() => setActionModal(null)} disabled={isSaving} style={btnGhost}>Cancel</button>
              <button onClick={saveAction} disabled={isSaving} style={{ ...btnPrimary, opacity: isSaving ? 0.5 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Save as Chain modal */}
      {chainModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setChainModal(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.22)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '13px', width: '420px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,.14)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
              <div style={{ fontFamily: "'Instrument Sans',sans-serif", fontSize: '16px', fontWeight: 600, flex: 1 }}>Save as Chain</div>
              <span onClick={() => setChainModal(null)} style={{ fontSize: '17px', color: 'var(--text-3)', cursor: 'pointer' }}>✕</span>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ fontFamily: "'Instrument Sans',sans-serif", fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px' }}>Name this chain — it will appear in your Action Library.</div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Chain name</label>
              <input value={chainName} onChange={e => setChainName(e.target.value)} placeholder='e.g. "Full Design Polish"'
                style={{ width: '100%', background: '#f7f7f7', border: '1px solid var(--border)', borderRadius: '9px', padding: '10px 13px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', color: 'var(--text)', boxSizing: 'border-box' }} />
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: '6px', marginTop: '14px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Description (optional)</label>
              <textarea value={chainDescription} onChange={e => setChainDescription(e.target.value)} placeholder="Describe what this chain does" rows={2}
                style={{ width: '100%', background: '#f7f7f7', border: '1px solid var(--border)', borderRadius: '9px', padding: '10px 13px', fontSize: '13px', fontFamily: 'inherit', outline: 'none', color: 'var(--text)', resize: 'none', boxSizing: 'border-box' }} />
              <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {chainModal.changeIds.map(id => {
                  const c = changes.find(ch => ch.id === id)
                  return c ? (
                    <span key={id} style={{ fontSize: '12px', background: '#f0f0f0', color: '#333', padding: '4px 10px', borderRadius: '20px', fontWeight: 500 }}>{c.title}</span>
                  ) : null
                })}
              </div>
            </div>
            <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '7px', justifyContent: 'flex-end' }}>
              <button onClick={() => setChainModal(null)} style={btnGhost}>Cancel</button>
              <button onClick={saveChain} style={btnPrimary}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Companion panel */}
      {showCompanion && <CompanionPanel onClose={() => setShowCompanion(false)} />}
    </main>
  )
}

const btnPrimary = { padding: '8px 16px', background: '#0a0a0a', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }
const btnGhost   = { padding: '8px 16px', background: 'transparent', color: 'var(--text-3)', border: '1px solid transparent', borderRadius: '9px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }
const zoomBtn    = { padding: '5px 8px', border: '1px solid #d1d5dc', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: '#fff', color: 'var(--text)', fontFamily: 'inherit', lineHeight: 1 }
