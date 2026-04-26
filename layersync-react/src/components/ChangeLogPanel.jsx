const CATEGORY_COLORS = {
  Visual:     '#5BC4C0',
  Layout:     '#818CF8',
  Typography: '#F5B08A',
  Color:      '#F08080',
}

export default function ChangeLogPanel({ changes = [], onChangeSelect, selectedIds = [], onSaveAction, onSaveChain, onRestore, activeChangeId, onActiveChange }) {
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
          const isActive   = activeChangeId === c.id
          const color = CATEGORY_COLORS[c.category] || '#5BC4C0'

          return (
            <div key={c.id} id={`change-row-${c.id}`}
              onClick={() => onActiveChange?.(isActive ? null : c.id)}
              style={{
                borderLeft: `3px solid ${color}`,
                background: isActive ? 'rgba(91,196,192,0.06)' : isChecked ? 'rgba(91,196,192,0.03)' : 'transparent',
                transition: 'background .15s',
                cursor: 'pointer',
                padding: '10px 10px 10px 8px',
                borderRadius: 8,
                marginBottom: 2,
              }}>
              {/* Main row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

              {/* Active detail */}
              {isActive && c.beforeValue && (
                <div style={{ marginLeft: 28, marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{c.description}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#f0f0f0', color: '#555' }}>{c.beforeValue}</span>
                    <span style={{ fontSize: 10, color: '#bbb' }}>→</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: color, color: '#fff' }}>{c.afterValue}</span>
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
