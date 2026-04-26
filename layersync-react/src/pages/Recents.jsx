import { useState, useEffect } from 'react'
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

const TOOL_BADGE = {
  Claude:       { bg: '#FFE4C2', fg: '#19735c' },
  Loveable:     { bg: '#FFD6E7', fg: '#19735c' },
  Cursor:       { bg: '#bfeee2', fg: '#19735c' },
  Replit:       { bg: '#E0F0FF', fg: '#19735c' },
  'Figma Make': { bg: '#E8D5FF', fg: '#19735c' },
  Other:        { bg: '#bfeee2', fg: '#19735c' },
}

const MOCK_FILES = [
  { id: 'mock-1', label: 'Dashboard Redesign',    source: 'Cursor',     timestamp: '2026-04-20T00:00:00Z', thumbnailAfter: cover1 },
  { id: 'mock-2', label: 'Marketing Landing Page', source: 'Loveable',   timestamp: '2026-04-20T00:00:00Z', thumbnailAfter: cover2 },
  { id: 'mock-3', label: 'Checkout Flow v3',       source: 'Claude',     timestamp: '2026-04-19T00:00:00Z', thumbnailAfter: cover3 },
  { id: 'mock-4', label: 'Onboarding Flow',        source: 'Figma Make', timestamp: '2026-04-19T00:00:00Z', thumbnailAfter: cover4 },
  { id: 'mock-5', label: 'Auth Screens',           source: 'Cursor',     timestamp: '2026-04-18T00:00:00Z', thumbnailAfter: cover5 },
  { id: 'mock-6', label: 'Settings Page',          source: 'Claude',     timestamp: '2026-04-18T00:00:00Z', thumbnailAfter: cover6 },
]

export default function Recents() {
  const [files, setFiles] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('iterait_versions') || '[]')
    if (stored.length > 0) {
      const seen = new Map()
      stored.forEach(v => {
        const key = v.label || v.id
        if (!seen.has(key) || new Date(v.timestamp) > new Date(seen.get(key).timestamp)) {
          seen.set(key, v)
        }
      })
      setFiles(Array.from(seen.values()).reverse().slice(0, 12))
    } else {
      setFiles(MOCK_FILES)
    }
  }, [])

  return (
    <main className="main-v2">
      <header className="topbar-v2">
        <div className="left" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span onClick={() => navigate('/')} style={{ color: 'var(--text-3)', cursor: 'pointer', fontSize: '14px' }}>Home</span>
          <span style={{ color: 'var(--text-4)', fontSize: '14px' }}>/</span>
          <span style={{ fontSize: '14px', color: 'var(--text)' }}>Files</span>
        </div>
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

      <div style={{ padding: '28px 32px 4px' }}>
        <h1 style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1 }}>Files</h1>
      </div>

      <section style={{ paddingTop: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', padding: '4px 32px 40px' }}>
          {files.map(file => {
            const badge = file.tool || file.source || 'Other'
            const colors = TOOL_BADGE[badge] || TOOL_BADGE['Other']
            const img = file.thumbnailAfter || file.thumbnail || null
            const dateStr = (() => { try { return new Date(file.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) } catch { return '' } })()
            return (
              <div key={file.id}
                onClick={() => { localStorage.setItem('iterait_active_file_id', file.id); navigate('/file-view') }}
                style={{ height: '232px', borderRadius: '10px', overflow: 'hidden', position: 'relative', boxShadow: '0 5px 10px rgba(0,0,0,.07)', cursor: 'pointer', background: '#e8e8e6', transition: 'transform .15s ease, box-shadow .15s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,.13)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 5px 10px rgba(0,0,0,.07)' }}
              >
                {img ? (
                  <img src={img} alt={file.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #5BC4C0, #7EB8E8)' }} />
                )}
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '80px', background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,.90) 40%, #ffffff 100%)' }} />
                <div style={{ position: 'absolute', left: '14px', bottom: '46px', background: colors.bg, color: colors.fg, fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 400, padding: '3px 10px', borderRadius: '30px', zIndex: 1 }}>{badge}</div>
                <div style={{ position: 'absolute', left: '14px', bottom: '18px', fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '16px', color: '#000', whiteSpace: 'nowrap', zIndex: 1, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.label}</div>
                <div style={{ position: 'absolute', right: '14px', bottom: '20px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#909090', whiteSpace: 'nowrap', zIndex: 1 }}>{dateStr}</div>
              </div>
            )
          })}
        </div>
      </section>

      <div style={{ height: '40px' }} />
    </main>
  )
}
