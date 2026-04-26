import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const WITH_ME = [
  { img: 'f94627bc-6abb-4924-91d5-76de8192aaf8', name: 'Dashboard Redesign', date: 'Shared Apr 20', av: 'S', avBg: 'linear-gradient(135deg,#c7bcfb,#8e7df0)', sharer: 'Sam Patel' },
  { img: 'f239607e-6832-405f-b968-b6f268227589', name: 'Marketing Landing Page', date: 'Shared Apr 18', av: 'J', avBg: 'linear-gradient(135deg,#a8dcbf,#5da77f)', sharer: 'Jordan Lee' },
  { img: 'b69d13c7-df9b-4a40-85a3-28a4c37f1bdf', name: 'Checkout Flow v3', date: 'Shared Apr 15', av: 'A', avBg: 'linear-gradient(135deg,#f5c2a0,#d6845a)', sharer: 'Aisha Rahman' },
  { img: '90861ab2-91bf-4480-b2a3-44322a3320fe', name: 'Onboarding Flow', date: 'Shared Apr 12', av: 'S', avBg: 'linear-gradient(135deg,#c7bcfb,#8e7df0)', sharer: 'Sam Patel' },
  { img: '8f55cf56-2829-4de5-9d14-72405140f695', name: 'Auth Screen Redesign', date: 'Shared Apr 10', av: 'J', avBg: 'linear-gradient(135deg,#a8dcbf,#5da77f)', sharer: 'Jordan Lee' },
]

const BY_ME = [
  { img: '443a8cec-e240-4179-bcb0-27f22951e499', name: 'Product Card System', date: 'Shared Apr 19 · 3 viewers', sharerText: 'Sam, Jordan, Aisha' },
  { img: 'f94627bc-6abb-4924-91d5-76de8192aaf8', name: 'Dashboard Redesign', date: 'Shared Apr 20 · 1 viewer', sharerText: 'Sam Patel · Can comment' },
  { img: 'b69d13c7-df9b-4a40-85a3-28a4c37f1bdf', name: 'Checkout Flow v3', date: 'Shared Apr 14 · 2 viewers', sharerText: 'Jordan, Aisha' },
]

function SharedCard({ img, name, date, av, avBg, sharer, onClick }) {
  return (
    <div onClick={onClick} style={{ borderRadius: '12px', overflow: 'hidden', background: '#fff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer', transition: 'transform .15s ease, box-shadow .15s ease' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
    >
      <div style={{ height: '160px', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        <img src={`https://www.figma.com/api/mcp/asset/${img}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '3px' }}>{date}</div>
        {av && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '10px', fontWeight: 700, color: '#fff', background: avBg, flexShrink: 0 }}>{av}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Shared by <strong style={{ color: 'var(--text-2)', fontWeight: 500 }}>{sharer}</strong></div>
          </div>
        )}
        {!av && sharer && (
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>{sharer}</div>
        )}
      </div>
    </div>
  )
}

export default function Shared() {
  const [view, setView] = useState('with-me')
  const navigate = useNavigate()

  return (
    <main className="main-v2">
      <header className="topbar-v2">
        <div className="left" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span onClick={() => navigate('/')} style={{ color: 'var(--text-3)', cursor: 'pointer', fontSize: '14px' }}>Home</span>
          <span style={{ color: 'var(--text-4)', fontSize: '14px' }}>/</span>
          <span style={{ fontSize: '14px', color: 'var(--text)' }}>Shared</span>
        </div>
        <div className="search-v2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input placeholder="Search shared files..." />
        </div>
        <div className="right">
          <img src="/avatar-profile.jpg" alt="Profile" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', display: 'block', cursor: 'pointer', border: '2px solid #f0f0f0' }} />
        </div>
      </header>

      <div style={{ padding: '28px 32px 0' }}>
        <h1 style={{ fontFamily: "'Instrument Sans', sans-serif", fontSize: '36px', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', lineHeight: 1.1 }}>Shared</h1>
      </div>

      <div style={{ display: 'flex', padding: '16px 32px 4px' }}>
        <div style={{ display: 'inline-flex', background: '#fff', border: '1px solid var(--border)', borderRadius: '999px', padding: '3px', gap: '2px', boxShadow: 'var(--shadow-sm)' }}>
          {['with-me', 'by-me'].map((v) => (
            <button key={v} onClick={() => setView(v)}
              style={{ border: 0, padding: '7px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s, color .15s', background: view === v ? 'var(--primary)' : 'transparent', color: view === v ? '#fff' : 'var(--text-2)' }}
            >
              {v === 'with-me' ? 'Shared with me' : 'Shared by me'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', padding: '20px 32px 60px' }}>
        {view === 'with-me'
          ? WITH_ME.map(f => <SharedCard key={f.name} {...f} onClick={() => navigate('/file-view')} />)
          : BY_ME.map(f => <SharedCard key={f.name} img={f.img} name={f.name} date={f.date} sharer={f.sharerText} onClick={() => navigate('/file-view')} />)
        }
      </div>
    </main>
  )
}
