import { useState } from 'react'

const CATEGORY_COLORS = {
  Visual:     '#3B82F6',
  Layout:     '#8B5CF6',
  Typography: '#F59E0B',
  Color:      '#14B8A6',
}

export default function ChangeLogPanel({ changes = [], onChangeSelect, selectedIds = [], onSaveAction, onSaveChain, onRestore }) {
  const [expandedId, setExpandedId] = useState(null)

  const checked = selectedIds.length
  const canSaveAction = checked === 1
  const canSaveChain  = checked >= 2
  const canRestore    = checked >= 1

  return (
    <div style={{ width: '270px', flexShrink: 0, background: '#fff', borderRadius: '10px', margin: '8px 8px 8px 0', boxShadow: '0 5px 4.9px rgba(0,0,0,.07)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 24px 12px', borderBottom: '1px solid var(--border)', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
        Changes
        {changes.length > 0 && (
          <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 400, color: 'var(--text-3)' }}>{changes.length} detected</span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {changes.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
            Select a version to see changes
          </div>
        )}
        {changes.map((c, i) => {
          const isChecked  = selectedIds.includes(c.id)
          const isExpanded = expandedId === c.id
          const color = CATEGORY_COLORS[c.category] || '#3B82F6'

          return (
            <div key={c.id} id={`change-row-${c.id}`}
              style={{ background: isChecked ? 'rgba(59,130,246,0.06)' : 'transparent', borderBottom: '1px solid var(--border)', padding: '0' }}>
              {/* Main row */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', cursor: 'pointer' }}
                onClick={() => setExpandedId(isExpanded ? null : c.id)}
              >
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: '1px' }}>{c.category}</div>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#0a0a0a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                </div>
                <div
                  onClick={e => { e.stopPropagation(); onChangeSelect?.(c.id) }}
                  style={{ width: '18px', height: '18px', border: `1.5px solid ${isChecked ? color : '#909090'}`, borderRadius: '4px', background: isChecked ? color : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', color: 'white', fontSize: '11px', fontWeight: 700 }}>
                  {isChecked && '✓'}
                </div>
              </div>

              {/* Expanded section */}
              {isExpanded && (
                <div style={{ padding: '0 16px 12px', borderTop: '1px solid rgba(0,0,0,.05)' }}>
                  <p style={{ fontSize: '12px', color: '#444', lineHeight: 1.5, margin: '10px 0 8px' }}>{c.description}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', background: '#f0f0f0', color: '#555', padding: '3px 8px', borderRadius: '4px', fontWeight: 500 }}>Before: <span style={{ color: '#111' }}>{c.beforeValue}</span></span>
                    <span style={{ fontSize: '11px', background: `${color}15`, color, padding: '3px 8px', borderRadius: '4px', fontWeight: 500 }}>After: <span style={{ fontWeight: 700 }}>{c.afterValue}</span></span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: '7px', borderTop: '1px solid var(--border)' }}>
        <button
          disabled={!canRestore}
          onClick={() => canRestore && onRestore?.()}
          style={{ padding: '8px 14px', background: canRestore ? 'rgba(21,80,225,.1)' : '#f5f5f5', border: `1px solid ${canRestore ? '#1550E1' : '#e0e0e0'}`, color: canRestore ? '#1550E1' : '#bbb', borderRadius: '10px', fontSize: '12px', fontWeight: 500, cursor: canRestore ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
          Restore Selected Changes
        </button>
        <button
          disabled={!canSaveAction}
          onClick={() => canSaveAction && onSaveAction?.(selectedIds[0])}
          style={{ padding: '8px 14px', border: `1px solid ${canSaveAction ? '#d9d9d9' : '#eeeeee'}`, color: canSaveAction ? 'var(--text)' : '#ccc', borderRadius: '10px', fontSize: '12px', fontWeight: 500, cursor: canSaveAction ? 'pointer' : 'not-allowed', background: '#fff', fontFamily: 'inherit' }}>
          Save as Action
        </button>
        <button
          disabled={!canSaveChain}
          onClick={() => canSaveChain && onSaveChain?.(selectedIds)}
          style={{ padding: '8px 14px', border: `1px solid ${canSaveChain ? '#d9d9d9' : '#eeeeee'}`, color: canSaveChain ? 'var(--text)' : '#ccc', borderRadius: '10px', fontSize: '12px', fontWeight: 500, cursor: canSaveChain ? 'pointer' : 'not-allowed', background: '#fff', fontFamily: 'inherit' }}>
          Save as Chain
        </button>
      </div>
    </div>
  )
}
