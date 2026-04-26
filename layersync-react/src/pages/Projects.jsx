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

const MOCK_PROJECTS = [
  { id: 'mock-p1', name: 'Dashboard Redesign',  date: '2026-04-20T00:00:00Z' },
  { id: 'mock-p2', name: 'Marketing Campaign',  date: '2026-04-18T00:00:00Z' },
  { id: 'mock-p3', name: 'Checkout Flow',       date: '2026-04-15T00:00:00Z' },
  { id: 'mock-p4', name: 'Onboarding v2',       date: '2026-04-12T00:00:00Z' },
]

export default function Projects() {
  const [projects, setProjects] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('iterait_projects') || '[]')
    setProjects(stored.length > 0 ? [...stored].reverse() : MOCK_PROJECTS)
  }, [])

  return (
    <main className="main-v2">
      <header className="topbar-v2">
        <div className="left" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span onClick={() => navigate('/')} style={{ color: 'var(--text-3)', cursor: 'pointer', fontSize: '14px' }}>Home</span>
          <span style={{ color: 'var(--text-4)', fontSize: '14px' }}>/</span>
          <span style={{ fontSize: '14px', color: 'var(--text)' }}>Projects</span>
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
        <h1 style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1 }}>Projects</h1>
      </div>

      <div style={{ display: 'flex', gap: '24px', overflowX: 'auto', padding: '10px 32px 32px', scrollSnapType: 'x proximity', scrollbarWidth: 'none' }}>
        {projects.map((p, index) => {
          const dateStr = (() => { try { return new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) } catch { return p.date || '' } })()
          return (
            <div key={p.id} onClick={() => navigate('/files')} className="pj"
              style={{ flex: '0 0 284px', height: '232px', borderRadius: '10px', position: 'relative', boxShadow: '0 5px 10px rgba(0,0,0,.07)', cursor: 'pointer', scrollSnapAlign: 'start', background: '#f0f0ee', transition: 'transform .15s ease, box-shadow .15s ease' }}
            >
              <div style={{ position: 'absolute', inset: 0, borderRadius: '10px', overflow: 'hidden' }}>
                <img
                  src={COVER_IMAGES[(index * 3) % 12]}
                  alt={p.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block', transition: 'transform .35s ease' }}
                  className="proj-img"
                />
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '162px', background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,.88) 45%, #ffffff 100%)', zIndex: 3 }} />
              <div style={{ position: 'absolute', left: '14px', bottom: '18px', fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '16px', color: '#000', whiteSpace: 'nowrap', zIndex: 4 }}>{p.name}</div>
              <div style={{ position: 'absolute', right: '14px', bottom: '20px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#909090', whiteSpace: 'nowrap', zIndex: 4 }}>{dateStr}</div>
            </div>
          )
        })}
      </div>

      <div style={{ height: '40px' }} />
    </main>
  )
}
