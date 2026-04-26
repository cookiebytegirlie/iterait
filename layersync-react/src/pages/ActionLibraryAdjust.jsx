import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const BG_OPTIONS = ['#FAFAF9', '#F5F5F4', '#F0EFEC', '#FBF7EF']

export default function ActionLibraryAdjust() {
  const navigate = useNavigate()
  const [gap, setGap] = useState(16)
  const [ls, setLs] = useState(-30)
  const [bg, setBg] = useState('#F5F5F4')
  const [checks, setChecks] = useState([true, true, false])

  const lsEm = (ls / 1000).toFixed(3) + 'em'

  const toggleCheck = (i) => setChecks(prev => prev.map((v, idx) => idx === i ? !v : v))

  return (
    <main className="main-v2">
      <header className="topbar-v2">
        <div className="left">Action Library</div>
        <div className="search-v2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input placeholder="Search..." />
        </div>
        <div className="right"><img src="/src/assets/avatar-profile.jpg" alt="Profile" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', display: 'block', cursor: 'pointer', border: '2px solid #f0f0f0' }} /></div>
      </header>

      <div style={{ padding: '8px 32px 60px' }}>
        <div className="crumbs">
          <span onClick={() => navigate('/actions')} style={{ cursor: 'pointer' }}>Action library</span>
          <span>/</span>
          <span style={{ color: 'var(--text)' }}>Notion-warm dashboard polish</span>
          <span>/</span>
          <span>Adjust</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '18px', alignItems: 'start' }}>
          {/* Left panel */}
          <section style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '18px', boxShadow: 'var(--shadow-sm)', position: 'sticky', top: '18px' }}>
            <div className="row-x spread">
              <h2 style={{ fontSize: '18px' }}>Adjust action</h2>
              <span className="badge draft">Editing</span>
            </div>
            <p className="muted small" style={{ marginTop: '6px' }}>Tweak parameters before applying. Live preview updates on the right.</p>

            <div className="field" style={{ marginTop: '14px' }}>
              <label className="muted tiny" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>Action name</label>
              <input className="input" defaultValue="Notion-warm dashboard polish" style={{ marginTop: '6px' }} />
            </div>

            <div className="field">
              <label className="muted tiny" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>Card row gap · <span>{gap}</span>px</label>
              <input type="range" min="8" max="32" value={gap} onChange={e => setGap(Number(e.target.value))} className="slider" />
            </div>

            <div className="field">
              <label className="muted tiny" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>Heading letter-spacing · <span>{lsEm}</span></label>
              <input type="range" min="-50" max="0" value={ls} onChange={e => setLs(Number(e.target.value))} className="slider" />
            </div>

            <div className="field">
              <label className="muted tiny" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>Background warmth</label>
              <div className="row-x" style={{ gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                {BG_OPTIONS.map(c => (
                  <span key={c} className={`pill${bg === c ? ' active' : ''}`} onClick={() => setBg(c)} style={{ background: c, color: '#1A1A19', borderColor: bg === c ? 'var(--border-strong)' : undefined }}>{c}</span>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="muted tiny" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>Apply to</label>
              <div className="checklist" style={{ marginTop: '8px' }}>
                {[
                  { label: 'All cards', sub: 'Top-level grid items', badge: 'current' },
                  { label: 'Headings', sub: 'H1, H2 only', badge: 'draft' },
                  { label: 'Hover states', sub: "Skip — keep file's existing", badge: 'archived' },
                ].map((item, i) => (
                  <div key={item.label} className="check-item">
                    <div className={`checkbox${checks[i] ? ' checked' : ''}`} onClick={() => toggleCheck(i)}>
                      {checks[i] && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"/></svg>}
                    </div>
                    <span className={`badge ${item.badge}`}>{item.label}</span>
                    <span className="small">{item.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="page-actions" style={{ marginTop: '18px' }}>
              <button className="btn btn-ghost" onClick={() => navigate('/actions')}>Cancel</button>
              <button className="btn btn-primary" onClick={() => navigate('/actions')}>Apply with these settings</button>
            </div>
          </section>

          {/* Right: live preview */}
          <section>
            <div className="row-x spread" style={{ marginBottom: '10px' }}>
              <div>
                <h2 style={{ fontSize: '18px' }}>Live preview</h2>
                <p className="muted small" style={{ marginTop: '4px' }}>Showing on <b>Dashboard Redesign · v12</b></p>
              </div>
              <div className="seg">
                <button className="active">Before</button>
                <button>After</button>
                <button>Split</button>
              </div>
            </div>
            <div className="canvas" style={{ height: '520px' }}>
              <div className="annot-counter">5 changes will apply</div>
              <div className="mock dashboard" style={{ background: bg, letterSpacing: lsEm }}>
                <div className="mock-bar">
                  <span className="mock-dot" style={{ background: '#FF6058' }} />
                  <span className="mock-dot" style={{ background: '#FFBD2E' }} />
                  <span className="mock-dot" style={{ background: '#27C93F' }} />
                </div>
                <div className="h1" style={{ height: '30px' }} />
                <div className="mock-content" style={{ top: '108px' }}>
                  <div className="row m" /><div className="row s" />
                  <div className="card-row" style={{ gap: gap + 'px' }}>
                    <div className="card-mock"><div className="strip" style={{ background: '#1A1A19', height: '8px' }} /><div className="strip" style={{ width: '60%' }} /></div>
                    <div className="card-mock"><div className="strip" style={{ background: '#FF5A82', height: '8px' }} /><div className="strip" style={{ width: '60%' }} /></div>
                    <div className="card-mock"><div className="strip" style={{ background: '#D97757', height: '8px' }} /><div className="strip" style={{ width: '60%' }} /></div>
                  </div>
                </div>
              </div>
              <div className="callout" style={{ top: '96px', left: '10%' }}>1</div>
              <div className="callout" style={{ top: '170px', left: '24%' }}>2</div>
              <div className="callout" style={{ top: '230px', left: '50%' }}>3</div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
