import { useState } from 'react'

const CATEGORY_COLORS = {
  Visual:     '#3B82F6',
  Layout:     '#8B5CF6',
  Typography: '#F59E0B',
  Color:      '#14B8A6',
}

const dotPulseStyle = `
@keyframes dot-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.6); }
  70%  { box-shadow: 0 0 0 10px rgba(59,130,246,0); }
  100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
}
`

export default function AnnotationDot({ id, number, category, title, position, isActive, onClick }) {
  const [hovered, setHovered] = useState(false)
  const [pulsing, setPulsing] = useState(false)
  const color = CATEGORY_COLORS[category] || '#3B82F6'

  function handleClick() {
    setPulsing(true)
    setTimeout(() => setPulsing(false), 600)
    onClick?.()
  }

  const size = isActive ? '30px' : '26px'
  const opacity = isActive || hovered ? 1 : 0.65
  const scale = hovered && !isActive ? 'scale(1.15)' : 'scale(1)'
  const shadow = isActive
    ? `0 0 0 3px rgba(59,130,246,0.4)`
    : pulsing
    ? 'none'
    : 'none'

  return (
    <>
      <style>{dotPulseStyle}</style>
      <div
        style={{
          position: 'absolute',
          left: '16px',
          top: `${position}%`,
          transform: `translateY(-50%) ${scale}`,
          width: size,
          height: size,
          borderRadius: '50%',
          background: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 700,
          cursor: 'pointer',
          opacity,
          boxShadow: pulsing
            ? undefined
            : shadow,
          animation: pulsing ? 'dot-pulse 0.6s ease-out' : 'none',
          transition: 'width .15s, height .15s, opacity .15s, box-shadow .15s',
          zIndex: 10,
          userSelect: 'none',
          pointerEvents: 'auto',
        }}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {number}
        {hovered && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,.8)',
            color: 'white',
            fontSize: '11px',
            fontWeight: 500,
            padding: '4px 8px',
            borderRadius: '5px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 20,
          }}>
            {title}
          </div>
        )}
      </div>
    </>
  )
}
