// status: 'no-file' | 'waiting' | 'watching' | 'detected' | 'paused'
// variant: 'full' (label + dot) | 'dot' (dot only, for sidebar)

const CONFIGS = {
  'no-file':  { color: '#C9C8C4', label: 'No file tracked',     pulse: false },
  'waiting':  { color: '#F59E0B', label: 'Waiting for watcher', pulse: false },
  'watching': { color: '#22C55E', label: 'Watching',             pulse: true  },
  'detected': { color: '#3B82F6', label: 'Change detected',      pulse: true  },
  'paused':   { color: '#9CA3AF', label: 'Paused',               pulse: false },
}

const PULSE_STYLE = `
  @keyframes watcher-pulse {
    0%   { box-shadow: 0 0 0 0 var(--pulse-color); }
    70%  { box-shadow: 0 0 0 5px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
  }
`

export default function WatcherStatus({ status = 'no-file', variant = 'full' }) {
  const cfg = CONFIGS[status] || CONFIGS['no-file']

  return (
    <>
      <style>{PULSE_STYLE}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{
          width:        variant === 'dot' ? 7 : 8,
          height:       variant === 'dot' ? 7 : 8,
          borderRadius: '50%',
          background:   cfg.color,
          flexShrink:   0,
          '--pulse-color': cfg.color + '66',
          animation:    cfg.pulse ? 'watcher-pulse 2s ease-out infinite' : 'none',
        }} />
        {variant === 'full' && (
          <span style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: "'Inter', sans-serif" }}>
            {cfg.label}
          </span>
        )}
      </div>
    </>
  )
}
