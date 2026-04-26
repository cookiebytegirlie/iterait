import { useState, useEffect, useRef, useCallback } from 'react'
import WatcherStatus from '../components/WatcherStatus'
import colorLogo from '../assets/Color Logo.png'

// ── Constants ────────────────────────────────────────────────────────────────
const API_BASE    = 'http://localhost:4000'
const PREFS_KEY   = 'iterait_watcher_prefs'
const TOKEN_KEY   = 'iterait_api_token'
const POLL_MS     = 5000

const SOURCE_TOOLS = ['Claude Code', 'Claude', 'Cursor', 'Loveable', 'Replit', 'Other']

const TOOL_COLORS = {
  'Claude Code': { bg: '#FFF3E8', fg: '#C05E28' },
  'Claude':      { bg: '#FFE4C2', fg: '#8A4A00' },
  'Cursor':      { bg: '#C8F0EA', fg: '#1A8272' },
  'Loveable':    { bg: '#FFD6E7', fg: '#9D1A56' },
  'Replit':      { bg: '#E0F0FF', fg: '#1550E1' },
  'Other':       { bg: '#F0F0EE', fg: '#555' },
}

const TYPE_LABELS = {
  added:        'Added',
  removed:      'Removed',
  text_change:  'Text changed',
  class_change: 'Style changed',
  style_change: 'Style changed',
  attr_change:  'Attribute changed',
  title_change: 'Title changed',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadPrefs()  { try { return JSON.parse(localStorage.getItem(PREFS_KEY))  || null } catch { return null } }
function savePrefs(p) { localStorage.setItem(PREFS_KEY, JSON.stringify(p)) }
function loadToken()  { return localStorage.getItem(TOKEN_KEY) || '' }
function saveToken(t) { localStorage.setItem(TOKEN_KEY, t) }

function authHeaders(token) { return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return 'just now'
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Section({ title, children, style }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border)', ...style }}>
      {title && (
        <div style={{ padding: '10px 16px 6px', fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

function ToolPills({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {SOURCE_TOOLS.map(t => {
        const sel = value === t
        return (
          <button key={t} onClick={() => onChange(sel ? '' : t)}
            style={{ padding: '5px 12px', borderRadius: 999, border: `1.5px solid ${sel ? '#1A1A19' : '#e0e0e0'}`, background: sel ? '#1A1A19' : '#fff', color: sel ? '#fff' : '#444', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s' }}>
            {t}
          </button>
        )
      })}
    </div>
  )
}

function InputField({ label, value, onChange, placeholder, type = 'text', mono = false }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ width: '100%', border: `1.5px solid ${focused ? '#aaa' : '#e8e8e8'}`, borderRadius: 8, padding: '8px 10px', fontSize: mono ? '11px' : '13px', fontFamily: mono ? 'monospace' : 'inherit', outline: 'none', background: '#fff', color: 'var(--text)', boxSizing: 'border-box', transition: 'border-color .15s' }}
      />
    </div>
  )
}

// ── Track New File Panel ──────────────────────────────────────────────────────
function TrackFilePanel({ token, onSaved, onCancel }) {
  const [filePath,    setFilePath]    = useState('')
  const [projectName, setProjectName] = useState('')
  const [fileName,    setFileName]    = useState('')
  const [tool,        setTool]        = useState('Claude Code')
  const [apiToken,    setApiToken]    = useState(token)
  const [error,       setError]       = useState('')
  const [saving,      setSaving]      = useState(false)
  const [done,        setDone]        = useState(null) // saved prefs

  // Auto-fill fileName from filePath
  useEffect(() => {
    if (!filePath) return
    const base = filePath.split('/').pop().split('\\').pop()
    if (base.toLowerCase().endsWith('.html')) setFileName(base)
  }, [filePath])

  async function handleSave() {
    setError('')
    if (!apiToken.trim()) return setError('API token is required')
    if (!filePath.trim()) return setError('File path is required')
    if (!projectName.trim()) return setError('Project name is required')
    if (!fileName.trim() || !fileName.toLowerCase().endsWith('.html')) return setError('File name must end with .html')

    setSaving(true)
    try {
      // Verify token works against the backend
      const res = await fetch(`${API_BASE}/versions/files`, { headers: { Authorization: `Bearer ${apiToken.trim()}` } })
      if (res.status === 401) throw new Error('Invalid API token — run `npm run token` in the backend folder to generate one')
      if (!res.ok) throw new Error(`Backend error (${res.status}) — is the backend running on ${API_BASE}?`)
    } catch (err) {
      if (err.message.includes('fetch')) {
        setError(`Cannot reach backend at ${API_BASE}. Start it with: cd backend && npm run dev`)
      } else {
        setError(err.message)
      }
      setSaving(false)
      return
    }

    const prefs = { filePath: filePath.trim(), projectName: projectName.trim(), fileName: fileName.trim(), sourceTool: tool }
    saveToken(apiToken.trim())
    savePrefs(prefs)
    setDone(prefs)
    setSaving(false)
    onSaved(prefs, apiToken.trim())
  }

  if (done) {
    const cmd = `node scripts/watchHtmlFile.js \\\n  --file "${done.filePath}" \\\n  --project "${done.projectName}" \\\n  --name ${done.fileName} \\\n  --source ${done.sourceTool.toLowerCase().replace(' ', '-')}`
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a', marginBottom: '4px' }}>✓ File tracked</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '14px' }}>Now start the watcher to begin capturing versions:</div>
        <div style={{ background: '#1A1A19', borderRadius: 8, padding: '12px 14px', fontSize: '11px', fontFamily: 'monospace', color: '#E5E5E5', lineHeight: 1.7, whiteSpace: 'pre', overflowX: 'auto' }}>
          {'# From the backend/ directory:\n' + cmd}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '10px' }}>
          Or with a config file: <code style={{ background: '#f0f0ee', padding: '1px 5px', borderRadius: 4 }}>--config watcher.config.json</code>
        </div>
        <button onClick={onCancel}
          style={{ marginTop: '14px', padding: '8px 16px', background: '#1A1A19', color: '#fff', border: 'none', borderRadius: 8, fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          Done
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>Track a new file</div>
      <div style={{ fontSize: '12px', color: 'var(--text-3)', marginBottom: '16px' }}>Connect a local HTML file to iterait.</div>

      <InputField label="API Token" value={apiToken} onChange={setApiToken} placeholder="Paste JWT from `npm run token`" mono />
      <InputField label="Local file path" value={filePath} onChange={setFilePath} placeholder="/Users/you/project/index.html" mono />
      <InputField label="Project name" value={projectName} onChange={setProjectName} placeholder="My Landing Page" />
      <InputField label="File name (.html)" value={fileName} onChange={setFileName} placeholder="index.html" />

      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Source tool</div>
        <ToolPills value={tool} onChange={setTool} />
      </div>

      {error && <div style={{ fontSize: '12px', color: '#DC2626', background: '#FFF0F0', padding: '8px 10px', borderRadius: 6, marginBottom: '12px' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onCancel}
          style={{ flex: 1, padding: '9px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: '#fff', fontFamily: 'inherit', color: '#555' }}>
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving}
          style={{ flex: 2, padding: '9px', background: saving ? '#ccc' : '#1A1A19', color: '#fff', border: 'none', borderRadius: 8, fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {saving ? 'Connecting…' : 'Start tracking'}
        </button>
      </div>
    </div>
  )
}

// ── Resume File Panel ─────────────────────────────────────────────────────────
function ResumeFilePanel({ token, onSaved, onCancel }) {
  const [files,   setFiles]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!token) { setError('No API token — track a file first.'); setLoading(false); return }
    fetch(`${API_BASE}/versions/files`, { headers: authHeaders(token) })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { setFiles(data); setLoading(false) })
      .catch(err => { setError(`Could not load files (${err})`); setLoading(false) })
  }, [token])

  function select(file) {
    const prefs = {
      filePath:    '',
      projectName: file.project_name,
      fileName:    file.name,
      sourceTool:  file.source_tool || 'unknown',
      fileId:      file.id,
    }
    savePrefs(prefs)
    onSaved(prefs)
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', marginBottom: '14px' }}>Resume a tracked file</div>
      {loading && <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Loading…</div>}
      {error   && <div style={{ fontSize: '12px', color: '#DC2626' }}>{error}</div>}
      {!loading && !error && files.length === 0 && (
        <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>No files found in the backend yet.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
        {files.map(f => {
          const tc = TOOL_COLORS[f.source_tool] || TOOL_COLORS['Other']
          return (
            <button key={f.id} onClick={() => select(f)}
              style={{ textAlign: 'left', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{f.name}</span>
                {f.source_tool && (
                  <span style={{ fontSize: '10px', fontWeight: 600, background: tc.bg, color: tc.fg, padding: '2px 7px', borderRadius: 999 }}>{f.source_tool}</span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{f.project_name}</div>
            </button>
          )
        })}
      </div>
      <button onClick={onCancel}
        style={{ width: '100%', padding: '9px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: '#fff', fontFamily: 'inherit', color: '#555' }}>
        Cancel
      </button>
    </div>
  )
}

// ── Main Companion ────────────────────────────────────────────────────────────
export default function Companion() {
  const [prefs,    setPrefs]    = useState(loadPrefs)
  const [token,    setToken]    = useState(loadToken)
  const [versions, setVersions] = useState([])
  const [compare,  setCompare]  = useState(null) // { changes, versionA, versionB }
  const [status,   setStatus]   = useState(() => (loadPrefs() ? 'waiting' : 'no-file'))
  const [panel,    setPanel]    = useState(null)  // null | 'track' | 'resume'

  const prevCountRef    = useRef(0)
  const detectedTimer   = useRef(null)

  // ── Fetch versions from backend ──────────────────────────────────────────
  const fetchVersions = useCallback(async (currentPrefs, currentToken) => {
    if (!currentPrefs?.fileId || !currentToken) return

    try {
      const res = await fetch(`${API_BASE}/versions/files/${currentPrefs.fileId}/versions`, {
        headers: authHeaders(currentToken),
      })
      if (!res.ok) { setStatus('paused'); return }
      const data = await res.json()
      setVersions(data)
      setStatus('watching')

      // Detect new version
      if (prevCountRef.current > 0 && data.length > prevCountRef.current) {
        clearTimeout(detectedTimer.current)
        setStatus('detected')
        detectedTimer.current = setTimeout(() => setStatus('watching'), 2500)
      }
      prevCountRef.current = data.length

      // Auto compare top 2
      if (data.length >= 2) {
        const [vB, vA] = data // newest first
        const cmpRes = await fetch(`${API_BASE}/versions/compare`, {
          method: 'POST',
          headers: authHeaders(currentToken),
          body: JSON.stringify({ versionAId: vA.id, versionBId: vB.id }),
        })
        if (cmpRes.ok) setCompare(await cmpRes.json())
      }
    } catch {
      setStatus('paused')
    }
  }, [])

  // ── After setup: resolve fileId from backend ─────────────────────────────
  const resolveFileId = useCallback(async (p, t) => {
    if (p.fileId) return p
    try {
      const res = await fetch(`${API_BASE}/versions/files`, { headers: authHeaders(t) })
      if (!res.ok) return p
      const files = await res.json()
      const match = files.find(f => f.name === p.fileName && f.project_name === p.projectName)
      if (!match) return p
      const resolved = { ...p, fileId: match.id }
      savePrefs(resolved)
      return resolved
    } catch { return p }
  }, [])

  // ── Poll for new versions ────────────────────────────────────────────────
  useEffect(() => {
    if (!prefs || !token) return

    let cancelled = false
    let resolvedPrefs = prefs

    const poll = async () => {
      if (cancelled) return
      if (!resolvedPrefs.fileId) {
        resolvedPrefs = await resolveFileId(resolvedPrefs, token)
        if (!resolvedPrefs.fileId) {
          setStatus('waiting')
          return
        }
        setPrefs(resolvedPrefs)
      }
      await fetchVersions(resolvedPrefs, token)
    }

    poll()
    const id = setInterval(poll, POLL_MS)
    return () => { cancelled = true; clearInterval(id); clearTimeout(detectedTimer.current) }
  }, [prefs, token, fetchVersions, resolveFileId])

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleRestoreVersion(versionId) {
    if (!versionId) return
    try {
      const res = await fetch(`${API_BASE}/versions/${versionId}/restore-full`, {
        method: 'POST',
        headers: authHeaders(token)
      })
      if (!res.ok) throw new Error('Restore failed')
      window.__toast?.('Version restored successfully')
      await fetchVersions(prefs, token)
    } catch (err) {
      console.error('Restore failed:', err)
      window.__toast?.('Restore failed — please try again')
    }
  }

  function handleFileSaved(newPrefs, newToken) {
    setPrefs(newPrefs)
    setToken(newToken)
    setStatus('waiting')
    setPanel(null)
  }

  function handleResumed(newPrefs) {
    setPrefs(newPrefs)
    setPanel(null)
    setStatus('waiting')
  }

  function handleClearTracking() {
    localStorage.removeItem(PREFS_KEY)
    setPrefs(null)
    setVersions([])
    setCompare(null)
    setStatus('no-file')
    setPanel(null)
    prevCountRef.current = 0
  }

  // ── Tool badge ───────────────────────────────────────────────────────────
  const toolColors = prefs?.sourceTool ? (TOOL_COLORS[prefs.sourceTool] || TOOL_COLORS['Other']) : null

  // ── Render panels ─────────────────────────────────────────────────────────
  if (panel === 'track') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Instrument Sans', sans-serif" }}>
        <CompanionHeader status={status} prefs={prefs} toolColors={toolColors} onOpenCompanion={null} />
        <TrackFilePanel token={token} onSaved={handleFileSaved} onCancel={() => setPanel(null)} />
      </div>
    )
  }

  if (panel === 'resume') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Instrument Sans', sans-serif" }}>
        <CompanionHeader status={status} prefs={prefs} toolColors={toolColors} />
        <ResumeFilePanel token={token} onSaved={handleResumed} onCancel={() => setPanel(null)} />
      </div>
    )
  }

  // ── Main companion view ───────────────────────────────────────────────────
  const latest  = versions[0]
  const previous = versions[1]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Instrument Sans', sans-serif" }}>
      <CompanionHeader status={status} prefs={prefs} toolColors={toolColors} />

      {/* Track file section */}
      <Section title="Track File">
        <div style={{ padding: '8px 16px 12px', display: 'flex', gap: '7px' }}>
          <button onClick={() => setPanel('track')}
            style={btnPrimary}>
            Track New File
          </button>
          <button onClick={() => setPanel('resume')}
            style={btnGhost}>
            Resume Existing
          </button>
        </div>
        {prefs && (
          <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-3)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {prefs.filePath || `${prefs.projectName} / ${prefs.fileName}`}
            </span>
            <button onClick={handleClearTracking}
              style={{ fontSize: '11px', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
              Untrack
            </button>
          </div>
        )}
      </Section>

      {/* Watcher command hint when waiting */}
      {prefs && status === 'waiting' && (
        <Section>
          <div style={{ padding: '10px 16px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#92400E', marginBottom: '4px' }}>Watcher not detected</div>
            <div style={{ fontSize: '11px', color: '#B45309', lineHeight: 1.5 }}>
              Run this in your terminal from the <code style={{ background: '#FEF3C7', padding: '0 3px', borderRadius: 3 }}>backend/</code> folder:
            </div>
            <div style={{ marginTop: '6px', background: '#1A1A19', borderRadius: 6, padding: '8px 10px', fontSize: '10px', fontFamily: 'monospace', color: '#E5E5E5', lineHeight: 1.6 }}>
              {`node scripts/watchHtmlFile.js \\\n  --file "${prefs.filePath || '/path/to/file.html'}" \\\n  --project "${prefs.projectName}" \\\n  --name ${prefs.fileName}`}
            </div>
          </div>
        </Section>
      )}

      {/* Recent versions */}
      <Section title={`Recent Versions${versions.length ? ` (${versions.length})` : ''}`}>
        {!prefs && (
          <div style={{ padding: '10px 16px 14px', fontSize: '12px', color: 'var(--text-3)' }}>
            No file tracked yet.
          </div>
        )}
        {prefs && versions.length === 0 && status !== 'paused' && (
          <div style={{ padding: '10px 16px 14px', fontSize: '12px', color: 'var(--text-3)' }}>
            No versions yet. Start the watcher to capture your first version.
          </div>
        )}
        {status === 'paused' && prefs && (
          <div style={{ padding: '10px 16px 14px', fontSize: '12px', color: '#9CA3AF' }}>
            Cannot reach backend at {API_BASE}.
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {versions.slice(0, 5).map((v, i) => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #e8e4dc, #d4d0c8)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#888', fontWeight: 600 }}>
                v{v.version_number}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  Version {v.version_number}
                  {i === 0 && <span style={{ fontSize: '9px', fontWeight: 600, background: '#FDD772', color: '#7a5c00', padding: '1px 5px', borderRadius: 4 }}>Current</span>}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '1px' }}>{timeAgo(v.created_at)}</div>
              </div>
              {i > 0 && (
                <button onClick={() => window.__toast?.(`Restore to v${v.version_number} — coming soon`)}
                  style={{ fontSize: '11px', color: '#1550E1', background: 'none', border: '1px solid #c8d8ff', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Restore
                </button>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Quick compare */}
      {compare && latest && previous && (
        <Section title="Quick Compare">
          <div style={{ padding: '6px 16px 4px', display: 'flex', gap: '8px', marginBottom: '4px' }}>
            <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden', border: '1.5px solid #e0e0e0', background: '#fafafa' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', padding: '4px 8px', borderBottom: '1px solid #efefef' }}>v{previous.version_number} — Before</div>
              <div style={{ height: 52, background: 'linear-gradient(135deg, #eae8e4, #d8d6d2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#aaa' }}>
                v{previous.version_number}
              </div>
            </div>
            <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden', border: '1.5px solid #FDD772', background: '#fafafa' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', padding: '4px 8px', borderBottom: '1px solid #efefef' }}>v{latest.version_number} — After</div>
              <div style={{ height: 52, background: 'linear-gradient(135deg, #eae8e4, #d8d6d2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#aaa' }}>
                v{latest.version_number}
              </div>
            </div>
          </div>
          <div style={{ padding: '4px 16px 12px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginBottom: '6px' }}>
              {compare.stats?.total ?? 0} change{compare.stats?.total !== 1 ? 's' : ''} detected
            </div>
            {(compare.changes || []).slice(0, 4).map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '4px 0', borderTop: i > 0 ? '1px solid #f5f5f5' : 'none' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#D1D5DB', marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text)' }}>
                    {TYPE_LABELS[c.type] || c.type} · <code style={{ fontSize: '10px', color: 'var(--text-3)' }}>{c.selector}</code>
                  </div>
                  {c.new && <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.new.slice(0, 60)}</div>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Action area */}
      <Section title="Actions" style={{ borderBottom: 'none' }}>
        <div style={{ padding: '8px 16px 20px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <button onClick={() => handleRestoreVersion(latest?.id)}
            style={{ ...btnPrimary, justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
            Restore Version
          </button>
          <div style={{ display: 'flex', gap: '7px' }}>
            <button onClick={() => window.__toast?.('Save as Action — coming soon')} style={{ ...btnGhost, flex: 1, justifyContent: 'center' }}>Save as Action</button>
            <button onClick={() => window.__toast?.('Save as Chain — coming soon')} style={{ ...btnGhost, flex: 1, justifyContent: 'center' }}>Save as Chain</button>
          </div>
        </div>
      </Section>
    </div>
  )
}

// ── Companion Header ──────────────────────────────────────────────────────────
function CompanionHeader({ status, prefs, toolColors }) {
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          <img src={colorLogo} alt="iterait" style={{ height: 28, display: 'block' }} /> <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>· companion</span>
        </span>
        <div style={{ flex: 1 }} />
        <WatcherStatus status={status} variant="full" />
      </div>
      {prefs ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {prefs.fileName}
            </span>
            {toolColors && (
              <span style={{ fontSize: '10px', fontWeight: 600, background: toolColors.bg, color: toolColors.fg, padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>
                {prefs.sourceTool}
              </span>
            )}
          </div>
          {prefs.filePath && (
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={prefs.filePath}>
              {prefs.filePath}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>No file tracked — start below</div>
      )}
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const btnPrimary = {
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '8px 14px', background: '#1A1A19', color: '#fff', border: 'none',
  borderRadius: 8, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
}
const btnGhost = {
  display: 'flex', alignItems: 'center', gap: '6px',
  padding: '8px 14px', background: '#fff', color: 'var(--text)',
  border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: '12px',
  fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
}
