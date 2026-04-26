import { useState } from 'react'

export default function VersionSidebar({ versions = [], currentVersionId, onVersionSelect, onVersionDelete, onVersionDrop }) {
  const [hoveredId, setHoveredId] = useState(null)

  function handleDragStart(e, version) {
    e.dataTransfer.setData('versionId', version.id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div style={{ width: '210px', flexShrink: 0, borderRight: '1px solid var(--border)', background: 'rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 15px 8px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '10px' }}>Project</div>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Versions</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', scrollbarWidth: 'none' }}>
        {versions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-3)', fontSize: '12px', lineHeight: 1.5 }}>
            Upload an HTML file to create your first version
          </div>
        )}
        {versions.map(v => {
          const isCurrent = v.id === currentVersionId
          const isHovered = v.id === hoveredId
          return (
            <div
              key={v.id}
              draggable
              onDragStart={e => handleDragStart(e, v)}
              onClick={() => onVersionSelect?.(v.id)}
              onMouseEnter={() => setHoveredId(v.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: `1.5px solid ${isCurrent ? '#FDD772' : 'transparent'}`, opacity: isCurrent ? 1 : 0.55, transition: 'border-color .15s, opacity .15s', position: 'relative' }}
            >
              {isCurrent && (
                <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: '9px', fontWeight: 500, padding: '2px 6px', borderRadius: '4px', zIndex: 1 }}>Current</div>
              )}
              {isHovered && onVersionDelete && (
                <button
                  onClick={e => { e.stopPropagation(); onVersionDelete(v.id) }}
                  title="Delete version"
                  style={{ position: 'absolute', top: '6px', left: '6px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(220,38,38,.85)', border: 'none', color: '#fff', fontSize: '12px', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, padding: 0 }}
                >×</button>
              )}
              {v.thumbnail ? (
                <img src={v.thumbnail} alt={`Version ${v.number}`} style={{ width: '100%', height: '96px', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '96px', background: `linear-gradient(135deg, #e8e4dc, #d4d0c8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '11px' }}>v{v.number}</div>
              )}
              <div style={{ background: '#fff', padding: '7px 10px 8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Version {v.number}{isCurrent ? ' · Current' : ''}
                </div>
                {v.label && <div style={{ fontSize: '11px', color: '#777', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.label}</div>}
                <div style={{ fontSize: '10px', color: '#909090', marginTop: '2px' }}>{v.timestamp}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
