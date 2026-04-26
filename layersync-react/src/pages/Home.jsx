import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import cover1 from '../assets/file cover image 1.jpg'
import cover2 from '../assets/file cover image 2.jpg'
import cover3 from '../assets/file cover image 3.jpg'
import cover4 from '../assets/file cover image 4.jpg'
import cover5 from '../assets/file cover image 5.jpg'
import cover6 from '../assets/file cover image 6.jpg'
import cover7 from '../assets/file cover image 7.jpg'
import cover8 from '../assets/file cover image 8.jpg'
import cover9 from '../assets/file cover image 9.jpg'
import cover10 from '../assets/file cover image 10.jpg'
import cover11 from '../assets/file cover image 11.jpg'
import cover12 from '../assets/file cover image 12.jpg'

const COVER_IMAGES = [cover1, cover2, cover3, cover4, cover5, cover6, cover7, cover8, cover9, cover10, cover11, cover12]

const TOOLS = ['Claude', 'Loveable', 'Cursor', 'Replit', 'Figma Make', 'Other']

const TOOL_BADGE = {
  Claude:      { bg: '#FFE4C2', fg: '#8A4A00' },
  Loveable:    { bg: '#FFD6E7', fg: '#9D1A56' },
  Cursor:      { bg: '#C8F0EA', fg: '#1A8272' },
  Replit:      { bg: '#E0F0FF', fg: '#1550E1' },
  'Figma Make':{ bg: '#E8D5FF', fg: '#5B1D9D' },
  Other:       { bg: '#F0F0F0', fg: '#555' },
}

function loadVersions()  { try { return JSON.parse(localStorage.getItem('iterait_versions')  || '[]') } catch { return [] } }
function loadProjects()  { try { return JSON.parse(localStorage.getItem('iterait_projects')  || '[]') } catch { return [] } }

const MOCK_FILES = [
  { id: 'mock-1', label: 'Marketing Landing Page', source: 'Cursor',     timestamp: '2026-04-25T00:00:00Z', thumbnailAfter: cover1 },
  { id: 'mock-2', label: 'Dashboard Redesign v2',  source: 'Loveable',   timestamp: '2026-04-24T00:00:00Z', thumbnailAfter: cover2 },
  { id: 'mock-3', label: 'Checkout Flow v3',       source: 'Claude',     timestamp: '2026-04-23T00:00:00Z', thumbnailAfter: cover3 },
  { id: 'mock-4', label: 'Onboarding Screens',     source: 'Figma Make', timestamp: '2026-04-22T00:00:00Z', thumbnailAfter: cover4 },
]

const MOCK_PROJECTS = [
  { id: 'mock-p1', name: 'Dashboard Redesign', date: '2026-04-20T00:00:00Z' },
  { id: 'mock-p2', name: 'Marketing Campaign', date: '2026-04-18T00:00:00Z' },
  { id: 'mock-p3', name: 'Checkout Flow',      date: '2026-04-15T00:00:00Z' },
  { id: 'mock-p4', name: 'Onboarding v2',      date: '2026-04-12T00:00:00Z' },
]

function SectionHeader({ title, buttonLabel, onButtonClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '22px 32px 6px' }}>
      <div style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)', flex: 1 }}>{title}</div>
      <button
        onClick={onButtonClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', border: '1px solid #d1d5dc', borderRadius: '10px', fontSize: '13px', fontWeight: 500, color: hov ? '#0a0a0a' : 'var(--text)', background: hov ? '#f7f7f7' : '#fff', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .12s, color .12s' }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        {buttonLabel}
      </button>
    </div>
  )
}

function ToolPills({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {TOOLS.map(t => {
        const selected = value === t
        return (
          <button key={t} onClick={() => onChange(selected ? '' : t)}
            style={{ padding: '6px 14px', borderRadius: '999px', border: `1.5px solid ${selected ? '#0a0a0a' : '#d1d5dc'}`, background: selected ? '#0a0a0a' : '#fff', color: selected ? '#fff' : '#333', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s' }}>
            {t}
          </button>
        )
      })}
    </div>
  )
}

function inputStyle(focused) {
  return { width: '100%', border: `1.5px solid ${focused ? '#aaa' : '#e8e8e8'}`, borderRadius: '10px', padding: '10px 13px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', color: '#111', background: '#fff', boxSizing: 'border-box', transition: 'border-color .15s' }
}

function Label({ children }) {
  return <div style={{ fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '8px', fontFamily: "'Instrument Sans', sans-serif" }}>{children}</div>
}

function Field({ children, style }) {
  return <div style={{ marginBottom: '20px', ...style }}>{children}</div>
}

// ─── Track New File Modal ─────────────────────────────────────────────────────
function TrackFileModal({ onClose, onSaved }) {
  const dropRef       = useRef(null)
  const browseRef     = useRef(null)
  const [droppedHtml, setDroppedHtml] = useState(null)
  const [fileName,    setFileName]    = useState('')
  const [description, setDescription]= useState('')
  const [tool,        setTool]        = useState('')
  const [project,     setProject]    = useState('')
  const [dragOver,    setDragOver]   = useState(false)
  const [focusedField, setFocused]   = useState(null)
  const projects = loadProjects()

  function readFile(file) {
    if (!file || !file.name.toLowerCase().endsWith('.html')) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      setDroppedHtml(evt.target.result)
      setFileName(file.name.replace(/\.html?$/i, ''))
    }
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    readFile(e.dataTransfer.files[0])
  }

  function handleConfirm() {
    if (!droppedHtml) return
    const existing = loadVersions()
    const name = fileName.trim() || 'Untitled'
    const badge = TOOL_BADGE[tool] || TOOL_BADGE['Other']
    const newVer = {
      id: `v${Date.now()}`,
      number: existing.length + 1,
      label: name,
      description,
      tool,
      projectId: project,
      timestamp: new Date().toLocaleString(),
      htmlContent: droppedHtml,
      thumbnail: null,
      changes: [],
    }
    localStorage.setItem('iterait_versions', JSON.stringify([...existing, newVer]))
    onSaved(newVer, badge)
    window.__toast?.(`${name} is now being tracked`)
    onClose()
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', fontFamily: "'Instrument Sans', sans-serif" }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.02em' }}>Track a new file</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '20px', lineHeight: 1, padding: 0, marginTop: '2px' }}>×</button>
          </div>
          <div style={{ fontSize: '14px', color: '#888', marginBottom: '24px', lineHeight: 1.5 }}>Tell iterait what you're building so it can label your versions intelligently.</div>
        </div>

        <div style={{ padding: '0 28px 8px' }}>
          {/* Drop zone */}
          <Field>
            <Label>HTML file</Label>
            <div
              ref={dropRef}
              onClick={() => !droppedHtml && browseRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                border: droppedHtml
                  ? '1.5px solid #22c55e'
                  : dragOver
                    ? '1.5px solid #1550E1'
                    : '1.5px dashed #d1d5dc',
                borderRadius: '10px',
                padding: '24px 16px',
                textAlign: 'center',
                background: droppedHtml ? '#f0fdf4' : dragOver ? '#f0f4ff' : '#fafafa',
                cursor: droppedHtml ? 'default' : 'pointer',
                transition: 'all .15s',
              }}>
              {droppedHtml ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>✓</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a' }}>{fileName}.html ready</span>
                  <button onClick={e => { e.stopPropagation(); setDroppedHtml(null); setFileName('') }}
                    style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '14px', padding: 0, lineHeight: 1 }}>×</button>
                </div>
              ) : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragOver ? '#1550E1' : '#aaa'} strokeWidth="1.5" style={{ marginBottom: '8px' }}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <div style={{ fontSize: '14px', color: dragOver ? '#1550E1' : '#666', fontWeight: 500 }}>Drop your .html file here</div>
                  <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>or click to browse</div>
                </>
              )}
            </div>
            <input ref={browseRef} type="file" accept=".html,.htm" style={{ display: 'none' }}
              onChange={e => { readFile(e.target.files[0]); e.target.value = '' }} />
          </Field>

          {/* File name */}
          <Field>
            <Label>File name</Label>
            <input value={fileName} onChange={e => setFileName(e.target.value)}
              placeholder="e.g. landing-page-v2"
              onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
              style={inputStyle(focusedField === 'name')} />
          </Field>

          {/* Description */}
          <Field>
            <Label>What are you building?</Label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. A SaaS landing page for a habit tracking app"
              onFocus={() => setFocused('desc')} onBlur={() => setFocused(null)}
              style={inputStyle(focusedField === 'desc')} />
          </Field>

          {/* Tool */}
          <Field>
            <Label>Which tool are you using?</Label>
            <ToolPills value={tool} onChange={setTool} />
          </Field>

          {/* Project */}
          <Field style={{ marginBottom: '8px' }}>
            <Label>Add to project <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span></Label>
            <select value={project} onChange={e => setProject(e.target.value)}
              onFocus={() => setFocused('proj')} onBlur={() => setFocused(null)}
              style={{ ...inputStyle(focusedField === 'proj'), color: project ? '#111' : '#999', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 13px center', paddingRight: '36px' }}>
              <option value="">No project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button onClick={onClose}
            style={{ padding: '10px 20px', background: 'transparent', border: '1.5px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={!droppedHtml}
            style={{ padding: '10px 20px', background: droppedHtml ? '#0a0a0a' : '#d4d4d4', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: droppedHtml ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'background .15s' }}>
            Start tracking
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── New Project Modal ────────────────────────────────────────────────────────
function NewProjectModal({ onClose, onSaved }) {
  const [name,        setName]       = useState('')
  const [description, setDescription]= useState('')
  const [tool,        setTool]       = useState('')
  const [selectedFiles, setSelected] = useState([])
  const [focusedField, setFocused]   = useState(null)
  const versions = loadVersions()

  function toggleFile(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleConfirm() {
    if (!name.trim()) return
    const existing = loadProjects()
    const newProj = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      description,
      tool,
      fileIds: selectedFiles,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }
    localStorage.setItem('iterait_projects', JSON.stringify([...existing, newProj]))
    onSaved(newProj)
    window.__toast?.(`${newProj.name} created`)
    onClose()
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', width: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', fontFamily: "'Instrument Sans', sans-serif" }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.02em' }}>New project</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '20px', lineHeight: 1, padding: 0, marginTop: '2px' }}>×</button>
          </div>
          <div style={{ fontSize: '14px', color: '#888', marginBottom: '24px', lineHeight: 1.5 }}>Group related files together.</div>
        </div>

        <div style={{ padding: '0 28px 8px' }}>
          {/* Project name */}
          <Field>
            <Label>Project name</Label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Dashboard Redesign"
              onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
              style={inputStyle(focusedField === 'name')} />
          </Field>

          {/* Description */}
          <Field>
            <Label>Description</Label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Rebuilding the main dashboard UI — cleaner cards, better hierarchy"
              rows={3}
              onFocus={() => setFocused('desc')} onBlur={() => setFocused(null)}
              style={{ ...inputStyle(focusedField === 'desc'), resize: 'none', lineHeight: 1.5 }} />
          </Field>

          {/* Tool */}
          <Field>
            <Label>Which tool are you using?</Label>
            <ToolPills value={tool} onChange={setTool} />
          </Field>

          {/* Files */}
          <Field style={{ marginBottom: '8px' }}>
            <Label>Add files <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span></Label>
            {versions.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#aaa', padding: '12px 0' }}>No tracked files yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {versions.map(v => (
                  <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 13px', border: `1.5px solid ${selectedFiles.includes(v.id) ? '#0a0a0a' : '#e8e8e8'}`, borderRadius: '10px', cursor: 'pointer', transition: 'border-color .15s' }}>
                    <input type="checkbox" checked={selectedFiles.includes(v.id)} onChange={() => toggleFile(v.id)}
                      style={{ width: '15px', height: '15px', cursor: 'pointer', accentColor: '#0a0a0a' }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{v.label || `Version ${v.number}`}</div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '1px' }}>{v.timestamp}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </Field>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button onClick={onClose}
            style={{ padding: '10px 20px', background: 'transparent', border: '1.5px solid #e8e8e8', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: '#555' }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={!name.trim()}
            style={{ padding: '10px 20px', background: name.trim() ? '#0a0a0a' : '#d4d4d4', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'background .15s' }}>
            Create project
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Home ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate()
  const [versions,  setVersions]  = useState(loadVersions)
  const [projects,  setProjects]  = useState(loadProjects)
  const [showFileModal,    setShowFileModal]    = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)

  function onFileSaved(newVer) {
    setVersions(loadVersions())
  }

  function onProjectSaved(newProj) {
    setProjects(loadProjects())
  }

  const recents = (versions.length > 0 ? [...versions].reverse().slice(0, 4) : MOCK_FILES).map(v => {
    const badge = v.tool || v.source || 'Other'
    const colors = TOOL_BADGE[badge] || { bg: '#E8F0FF', fg: '#1550E1' }
    return {
      name: v.label || `Version ${v.number}`,
      date: (() => { try { return new Date(v.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) } catch { return '' } })(),
      badge,
      badgeBg: colors.bg,
      badgeFg: colors.fg,
      thumbnail: v.thumbnailAfter || v.thumbnail || null,
      key: v.id,
    }
  })

  const displayProjects = (projects.length > 0 ? [...projects].reverse().slice(0, 4) : MOCK_PROJECTS).map(p => ({
    name: p.name,
    date: (() => { try { return new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) } catch { return p.date || '' } })(),
    key: p.id,
  }))

  return (
    <main className="main-v2">
      <header className="topbar-v2">
        <div className="left" />
        <div className="search-v2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input placeholder="Search..." />
        </div>
        <div className="right">
          <img src="/avatar-profile.jpg" alt="Profile" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', display: 'block', cursor: 'pointer', border: '2px solid #f0f0f0' }} />
        </div>
      </header>

      <div style={{
        background: 'linear-gradient(to right, #4DC8C4, #7BB8E8, #F5B08A, #F08080)',
        padding: '70px 36px 40px',
        margin: '0',
        borderRadius: '0',
        width: '100%',
      }}>
        <h1 style={{
          fontFamily: 'Instrument Sans, sans-serif',
          fontSize: '30px',
          fontWeight: '700',
          color: 'white',
        }}>
          Welcome back, Miranda.
        </h1>
      </div>

      <SectionHeader title="Recents" buttonLabel="Add File" onButtonClick={() => setShowFileModal(true)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '2px 32px 28px' }}>
        {recents.map((f, i) => (
          <div key={f.key || f.name + i}
            onClick={() => navigate('/file-view')}
            style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden', cursor: 'pointer', transition: 'transform .15s ease, box-shadow .15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
          >
            {f.thumbnail
              ? <img src={f.thumbnail} alt="" style={{ width: '100%', height: '156px', objectFit: 'cover', display: 'block' }} />
              : <div style={{ width: '100%', height: '156px', background: 'linear-gradient(135deg, #5BC4C0, #7EB8E8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>{f.name}</div>
            }
            <div style={{ padding: '12px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '999px', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 500, marginBottom: '8px', background: f.badgeBg, color: f.badgeFg }}>
                {f.badge}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '14px', color: '#000', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', maxWidth: '160px' }}>{f.name}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#999', flexShrink: 0 }}>{f.date}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SectionHeader title="Projects" buttonLabel="Add Project" onButtonClick={() => setShowProjectModal(true)} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '2px 32px 28px' }}>
        {displayProjects.map((f, i) => (
          <div key={f.key || f.name + i} onClick={() => navigate('/projects')} className="pj"
            style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflow: 'hidden', cursor: 'pointer', transition: 'transform .15s ease, box-shadow .15s ease', position: 'relative' }}
          >
            <div style={{ width: '100%', height: '156px', position: 'relative', overflow: 'hidden' }}>
              <img src={COVER_IMAGES[(i * 3) % 12]} className="proj-img" alt="" />
            </div>
            <div style={{ padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '14px', color: '#000' }}>{f.name}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#999' }}>{f.date}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: '40px' }} />

      {showFileModal    && <TrackFileModal   onClose={() => setShowFileModal(false)}    onSaved={onFileSaved}    />}
      {showProjectModal && <NewProjectModal  onClose={() => setShowProjectModal(false)} onSaved={onProjectSaved} />}
    </main>
  )
}
