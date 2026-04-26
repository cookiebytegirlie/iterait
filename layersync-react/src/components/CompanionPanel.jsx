import { useState, useRef, useEffect } from 'react'

function loadVersions() {
  try { return JSON.parse(localStorage.getItem('iterait_versions') || '[]') } catch { return [] }
}

const CATEGORY_COLORS = { Visual:'#3B82F6', Layout:'#8B5CF6', Typography:'#F59E0B', Color:'#14B8A6' }

export default function CompanionPanel({ onClose }) {
  const [pos, setPos] = useState({ x: window.innerWidth / 2 - 190, y: 80 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef(null)
  const versions = loadVersions().reverse() // newest first
  const current = versions[0]

  const onMouseDown = (e) => {
    setDragging(true)
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
  }

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging) return
      setPos({
        x: dragStart.current.px + e.clientX - dragStart.current.mx,
        y: dragStart.current.py + e.clientY - dragStart.current.my,
      })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging])

  const changes = current?.changes || []
  const compareVer = versions[1]

  return (
    <div style={{
      position: 'fixed',
      left: pos.x,
      top: pos.y,
      width: 380,
      zIndex: 1000,
      borderRadius: 14,
      background: '#fff',
      boxShadow: '0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      userSelect: dragging ? 'none' : 'auto',
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* Drag handle / top bar */}
      <div
        onMouseDown={onMouseDown}
        style={{ cursor: dragging ? 'grabbing' : 'grab', background: '#0a0a0a', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'white', flex: 1, letterSpacing: '-0.01em' }}>
          iterait <span style={{ opacity: .5, fontWeight: 400 }}>· companion</span>
        </span>
        {/* Watching dot */}
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 2px rgba(34,197,94,.3)', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', marginRight: 4 }}>watching</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontSize: '15px', lineHeight: 1, padding: '0 2px' }}>✕</button>
      </div>

      {/* File info strip */}
      <div style={{ padding: '8px 14px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '8px', background: '#fafafa' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {current?.label || 'No file tracked'}
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '1px' }}>
            {current ? `Version ${current.number} · ${current.timestamp}` : 'Upload an HTML file to begin'}
          </div>
        </div>
        <span style={{ fontSize: '10px', fontWeight: 600, background: '#C8F0EA', color: '#2A9D8F', padding: '2px 8px', borderRadius: 20 }}>iterait</span>
      </div>

      <div style={{ maxHeight: 480, overflowY: 'auto' }}>

        {/* Track File section */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '10px' }}>Track File</div>
          <div style={{ display: 'flex', gap: '7px' }}>
            <button style={{ flex: 1, padding: '8px 0', background: '#0a0a0a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Track New File
            </button>
            <button style={{ flex: 1, padding: '8px 0', background: 'white', color: '#333', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Resume Existing
            </button>
          </div>
        </div>

        {/* Recent Versions section */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '10px' }}>Recent Versions</div>
          {versions.length === 0 && (
            <div style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', padding: '12px 0' }}>No versions yet</div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {versions.slice(0, 4).map((v, i) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', borderRadius: '8px', background: i === 0 ? '#f7f7f7' : 'transparent', border: i === 0 ? '1px solid #e8e8e8' : '1px solid transparent' }}>
                {v.thumbnail
                  ? <img src={v.thumbnail} style={{ width: 36, height: 28, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} alt="" />
                  : <div style={{ width: 36, height: 28, borderRadius: 5, background: '#ececec', flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#111', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    Version {v.number}
                    {i === 0 && <span style={{ fontSize: '9px', fontWeight: 600, background: '#FDD772', color: '#7a5c00', padding: '1px 5px', borderRadius: 4 }}>Current</span>}
                  </div>
                  <div style={{ fontSize: '10px', color: '#888', marginTop: '1px' }}>{v.timestamp}</div>
                </div>
                {i > 0 && (
                  <button onClick={() => window.__toast?.(`Restored to Version ${v.number}`)} style={{ fontSize: '11px', color: '#1550E1', background: 'none', border: '1px solid #c8d8ff', borderRadius: '6px', padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    Restore
                  </button>
                )}
              </div>
            ))}
          </div>
          {versions.length > 4 && (
            <div style={{ fontSize: '12px', color: '#1550E1', cursor: 'pointer', marginTop: '8px', paddingLeft: '2px' }}>View all {versions.length} versions →</div>
          )}
        </div>

        {/* Quick Compare section */}
        <div style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '10px' }}>Quick Compare</div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1.5px solid #e0e0e0', background: '#fafafa' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#888', padding: '5px 8px', borderBottom: '1px solid #efefef' }}>{compareVer ? `v${compareVer.number} — Before` : 'Before'}</div>
              {compareVer?.thumbnail
                ? <img src={compareVer.thumbnail} style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} alt="" />
                : <div style={{ height: 72, background: '#ececec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#aaa' }}>—</div>
              }
            </div>
            <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1.5px solid #FDD772', background: '#fafafa' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#888', padding: '5px 8px', borderBottom: '1px solid #efefef' }}>{current ? `v${current.number} — After` : 'After'}</div>
              {current?.thumbnail
                ? <img src={current.thumbnail} style={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }} alt="" />
                : <div style={{ height: 72, background: '#ececec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#aaa' }}>—</div>
              }
            </div>
          </div>

          {/* Change rows */}
          {changes.length === 0 && (
            <div style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', padding: '8px 0' }}>No changes detected yet</div>
          )}
          {changes.slice(0, 4).map((c, i) => {
            const color = CATEGORY_COLORS[c.category] || '#3B82F6'
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '6px 4px', borderBottom: i < changes.slice(0,4).length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, flexShrink: 0 }}>{i+1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                  <div style={{ fontSize: '10px', color: '#888' }}>{c.category}</div>
                </div>
                <div style={{ width: 14, height: 14, border: '1.5px solid #ccc', borderRadius: '3px', flexShrink: 0 }} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
