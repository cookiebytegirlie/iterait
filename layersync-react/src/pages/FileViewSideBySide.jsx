import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import VersionSidebar from '../components/VersionSidebar'
import AnnotationDot from '../components/AnnotationDot'
import ChangeLogPanel from '../components/ChangeLogPanel'
import { captureBeforeAfter } from '../utils/captureSnapshot'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('iterait_api_token') || ''}` }
}

function loadVersions() {
  try { return JSON.parse(localStorage.getItem('iterait_versions') || '[]') } catch { return [] }
}
function loadActions() {
  try { return JSON.parse(localStorage.getItem('iterait_actions') || '[]') } catch { return [] }
}
function saveActions(a) { localStorage.setItem('iterait_actions', JSON.stringify(a)) }

const CATEGORY_COLORS = { Visual:'#3B82F6', Layout:'#8B5CF6', Typography:'#F59E0B', Color:'#14B8A6' }

export default function FileViewSideBySide() {
  const navigate  = useNavigate()
  const [versions, setVersions] = useState(loadVersions)

  const [currentVersionId, setCurrentVersionId] = useState(() => {
    const v = loadVersions(); return v.length ? v[v.length - 1].id : null
  })
  const [compareVersionId, setCompareVersionId] = useState(() => {
    const v = loadVersions(); return v.length >= 2 ? v[v.length - 2].id : null
  })
  const [activeChangeId, setActiveChangeId] = useState(null)
  const [selectedIds, setSelectedIds]       = useState([])
  const [actionModal, setActionModal]       = useState(null)
  const [actionName, setActionName]         = useState('')
  const [isSaving, setIsSaving]             = useState(false)
  const [chainModal, setChainModal]         = useState(null)
  const [chainName, setChainName]           = useState('')
  const [chainDescription, setChainDescription] = useState('')
  const [scale, setScale]   = useState(0.4)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart    = useRef(null)
  const canvasRef   = useRef(null)
  const scaleRef    = useRef(1)
  const offsetRef   = useRef({ x: 0, y: 0 })

  useEffect(() => { setScale(1); setOffset({ x: 0, y: 0 }) }, [currentVersionId])
  useEffect(() => { scaleRef.current = scale }, [scale])
  useEffect(() => { offsetRef.current = offset }, [offset])

  useEffect(() => {
    if (!isPanning) return
    const onMove = (e) => setOffset({ x: panStart.current.ox + e.clientX - panStart.current.mx, y: panStart.current.oy + e.clientY - panStart.current.my })
    const onUp   = () => setIsPanning(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [isPanning])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '=') setScale(p => Math.min(p + 0.05, 2))
      if (e.key === '-') setScale(p => Math.max(p - 0.05, 0.1))
      if (e.key === '0') setScale(0.4)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

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
      const delta = e.deltaY > 0 ? -0.01 : 0.01
      const ns = Math.min(Math.max(+(s + delta).toFixed(2), 0.1), 2)
      setScale(ns)
      setOffset({ x: cx - (ns / s) * (cx - o.x), y: cy - (ns / s) * (cy - o.y) })
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  const onPanMouseDown = (e) => { if (e.button !== 0) return; setIsPanning(true); panStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y } }

  const currentVersion = versions.find(v => v.id === currentVersionId)
  const compareVersion = versions.find(v => v.id === compareVersionId)
  const changes = currentVersion?.changes || []

  function handleVersionSelect(id) {
    if (id === currentVersionId) return
    // Always pair the selected version with its upload-time predecessor so the
    // Before panel and the change list are guaranteed to match.
    const idx = versions.findIndex(v => v.id === id)
    setCompareVersionId(idx > 0 ? versions[idx - 1].id : null)
    setCurrentVersionId(id)
    setActiveChangeId(null)
    setSelectedIds([])
  }

  function handleVersionDelete(id) {
    setVersions(prev => {
      const next = prev.filter(v => v.id !== id)
      localStorage.setItem('iterait_versions', JSON.stringify(next))
      if (currentVersionId === id) setCurrentVersionId(next.length ? next[next.length - 1].id : null)
      if (compareVersionId === id) setCompareVersionId(next.length >= 2 ? next[next.length - 2].id : null)
      return next
    })
  }

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
      const position = c.approximatePosition ?? 30
      const { thumbnailBefore, thumbnailAfter } = compareVersion?.htmlContent && currentVersion?.htmlContent
        ? await captureBeforeAfter(compareVersion.htmlContent, currentVersion.htmlContent, position)
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

  function openChainModal(changeIds) {
    setChainName('')
    setChainDescription('')
    setChainModal({ changeIds })
  }

  function saveChain() {
    const selectedChanges = changes.filter(c => chainModal.changeIds.includes(c.id))
    const h1 = Math.floor(Math.random() * 360)
    const h2 = Math.floor(Math.random() * 360)
    const existingChains = JSON.parse(localStorage.getItem('iterait_chains') || '[]')
    const newChain = {
      id: crypto.randomUUID(),
      name: chainName || 'Untitled Chain',
      description: chainDescription.trim(),
      changes: selectedChanges,
      htmlBefore: compareVersion?.htmlContent || '',
      htmlAfter: currentVersion?.htmlContent || '',
      platform: currentVersion?.source || 'Unknown',
      sourceFile: currentVersion?.label || '',
      versionBefore: compareVersion?.label || 'Previous',
      versionAfter: currentVersion?.label || 'Current',
      createdAt: new Date().toISOString(),
      gradient: `linear-gradient(135deg, hsl(${h1},65%,72%), hsl(${h2},65%,72%))`,
    }
    localStorage.setItem('iterait_chains', JSON.stringify([newChain, ...existingChains]))
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
        localStorage.setItem('iterait_versions', JSON.stringify(updated))
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
      localStorage.setItem('iterait_versions', JSON.stringify(updated))
      setVersions(updated)
      setCurrentVersionId(newVersion.id)
      setSelectedIds([])
      window.__toast?.(`${selectedChanges.length} change${selectedChanges.length !== 1 ? 's' : ''} restored`)
    } catch (err) {
      console.error('Partial restore failed:', err)
      window.__toast?.('Restore failed — please try again')
    }
  }

  function handleChangeSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setActiveChangeId(id)
  }

  function handleDotClick(id) {
    setActiveChangeId(id)
    const row = document.getElementById(`change-row-${id}`)
    row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const activeChange = changes.find(c => c.id === activeChangeId)

  return (
    <main className="main-v2" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100vh' }}>
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
          {currentVersion ? `Version ${currentVersion.number}` : 'No versions'}
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>View</span>
        <button onClick={() => navigate('/file-view')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1px solid #d1d5dc', borderRadius: '10px', fontSize: '13px', fontWeight: 500, color: 'var(--text)', cursor: 'pointer', background: '#fff', fontFamily: 'inherit' }}>
          Compare Versions
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', background: '#1550E1', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          onClick={() => handleRestoreVersion(currentVersionId)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          Restore Version
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* Version sidebar */}
        <VersionSidebar
          versions={[...versions].reverse()}
          currentVersionId={currentVersionId}
          onVersionSelect={handleVersionSelect}
          onVersionDelete={handleVersionDelete}
        />

        {/* Side-by-side canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderBottom: '1px solid var(--border)', background: '#fff', flexShrink: 0 }}>
            <button onClick={() => setScale(s => Math.max(+(s - 0.1).toFixed(2), 0.25))} style={zoomBtn}>−</button>
            <span style={{ fontSize: '12px', minWidth: '42px', textAlign: 'center', color: 'var(--text)', fontFamily: 'inherit' }}>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(+(s + 0.1).toFixed(2), 3))} style={zoomBtn}>+</button>
            <button onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }) }} style={{ ...zoomBtn, padding: '5px 10px', marginLeft: '2px' }}>Reset</button>
            <span style={{ marginLeft: '12px', fontSize: '12px', color: 'var(--text-3)' }}>
              Version {compareVersion?.number || '?'} — Before &nbsp;·&nbsp; Version {currentVersion?.number || '?'} — After
            </span>
          </div>
          <div ref={canvasRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', gap: '8px', padding: '8px', minHeight: 0, backgroundColor: '#F5F4F0', backgroundImage: 'radial-gradient(circle, #D0CEC8 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}>

            {/* Before panel */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {compareVersion ? (
                <>
                  <iframe srcDoc={compareVersion.htmlContent} style={{ width: '100%', height: '100%', border: 'none', display: 'block', transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`, transformOrigin: 'top left', pointerEvents: 'none' }} sandbox="allow-scripts allow-same-origin" title="Before" />
                  <div style={{ position: 'absolute', inset: 0, cursor: isPanning ? 'grabbing' : 'grab' }} onMouseDown={onPanMouseDown} />
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', fontSize: '13px' }}>No previous version</div>
              )}
            </div>

            {/* After panel with dots */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {currentVersion ? (
                <>
                  <iframe srcDoc={currentVersion.htmlContent} style={{ width: '100%', height: '100%', border: 'none', display: 'block', transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`, transformOrigin: 'top left', pointerEvents: 'none' }} sandbox="allow-scripts allow-same-origin" title="After" />
                  {activeChange && (
                    <div style={{ position: 'absolute', left: 0, right: 0, top: `${activeChange.approximatePosition - 9}%`, height: '18%', background: `${CATEGORY_COLORS[activeChange.category] || '#3B82F6'}14`, pointerEvents: 'none', transition: 'opacity .2s, top .2s', zIndex: 5 }} />
                  )}
                  <div style={{ position: 'absolute', inset: 0, zIndex: 8, cursor: isPanning ? 'grabbing' : 'grab' }} onMouseDown={onPanMouseDown} />
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
                    {changes.map((c, i) => (
                      <AnnotationDot key={c.id} id={c.id} number={i+1} category={c.category} title={c.title} position={c.approximatePosition} isActive={c.id === activeChangeId} onClick={() => handleDotClick(c.id)} />
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', fontSize: '13px' }}>No current version</div>
              )}
            </div>
          </div>
        </div>

        {/* Change log panel */}
        <ChangeLogPanel
          changes={changes}
          selectedIds={selectedIds}
          onChangeSelect={handleChangeSelect}
          onRestore={handleRestoreSelected}
          onSaveAction={openActionModal}
          onSaveChain={openChainModal}
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
              <button onClick={() => setActionModal(null)} disabled={isSaving} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }}>Cancel</button>
              <button onClick={saveAction} disabled={isSaving} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: isSaving ? 'not-allowed' : 'pointer', border: 'none', fontFamily: 'inherit', background: 'var(--text)', color: 'white', opacity: isSaving ? 0.5 : 1 }}>Save</button>
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
              <button onClick={() => setChainModal(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)' }}>Cancel</button>
              <button onClick={saveChain} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', border: 'none', fontFamily: 'inherit', background: 'var(--text)', color: 'white' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

const zoomBtn = { padding: '5px 8px', border: '1px solid #d1d5dc', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: '#fff', color: 'var(--text)', fontFamily: 'inherit', lineHeight: 1 }
