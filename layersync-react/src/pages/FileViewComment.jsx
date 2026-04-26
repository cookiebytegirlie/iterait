import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function FileViewComment() {
  const navigate = useNavigate()
  const [reply, setReply] = useState('')
  const [replies, setReplies] = useState([])
  const [resolved, setResolved] = useState(false)

  const sendReply = () => {
    if (!reply.trim()) return
    setReplies(prev => [...prev, reply.trim()])
    setReply('')
  }

  return (
    <div className="main-v2" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <header className="topbar-v2">
          <div className="left" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span onClick={() => navigate('/files')} style={{ color: 'var(--text-3)', cursor: 'pointer', fontSize: '14px' }}>Home</span>
            <span style={{ color: 'var(--text-4)', fontSize: '14px' }}>/</span>
            <span style={{ fontSize: '14px', color: 'var(--text)' }}>Dashboard Redesign</span>
          </div>
          <div className="search-v2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
            </svg>
            <input placeholder="Search..." />
          </div>
          <div className="right"><img src="/src/assets/avatar-profile.jpg" alt="Profile" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', display: 'block', cursor: 'pointer', border: '2px solid #f0f0f0' }} /></div>
        </header>

        <aside className="history-panel">
          <div className="history-head">
            <h3>Versions</h3>
            <button className="icon-btn" style={{ width: '28px', height: '28px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M15 6l-6 6 6 6"/></svg>
            </button>
          </div>
          <div className="history-list">
            <div className="history-item active">
              <div className="h-thumb"><div className="mock dashboard" style={{ position: 'absolute' }} /></div>
              <div>
                <div className="label">v12 — Final hover states</div>
                <div className="row-x" style={{ gap: '6px', marginTop: '4px' }}>
                  <span className="badge current">Current</span>
                  <span className="ts">2h ago</span>
                </div>
                <div className="changes">{resolved ? '1 unresolved · Sam' : '2 unresolved · Sam'}</div>
              </div>
            </div>
            <div className="history-item">
              <div className="h-thumb"><div className="mock dashboard" style={{ position: 'absolute', filter: 'hue-rotate(20deg)' }} /></div>
              <div>
                <div className="label">v11 — Sidebar refinements</div>
                <div className="row-x" style={{ gap: '6px', marginTop: '4px' }}>
                  <span className="badge draft">Draft</span>
                  <span className="ts">Yesterday</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="canvas-shell">
          <div className="canvas-head">
            <div>
              <div className="crumbs">
                <span onClick={() => navigate('/files')} style={{ cursor: 'pointer' }}>Home</span> <span>/</span>
                <span onClick={() => navigate('/file-view')} style={{ cursor: 'pointer' }}>Dashboard Redesign</span>
              </div>
              <div className="canvas-title">
                <h2>v12 — Final hover states</h2>
                <span className="badge current">Current</span>
                <span className="muted small">{resolved ? '1 unresolved comment' : '2 unresolved comments'}</span>
              </div>
            </div>
            <div className="row-x" style={{ gap: '8px' }}>
              <button className="btn btn-secondary">Share</button>
              <button className="btn btn-primary" onClick={() => navigate('/file-view')}>Save action chain</button>
            </div>
          </div>

          <div className="canvas">
            <div className="annot-counter">
              <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1A1A19' }} />
              6 changes annotated
              <span style={{ marginLeft: '10px', paddingLeft: '10px', borderLeft: '1px solid var(--border)', color: 'var(--text-2)' }}>
                {resolved ? '1 comment' : '2 comments'}
              </span>
            </div>

            <div className="mock dashboard" style={{ background: '#fff' }}>
              <div className="mock-bar">
                <span className="mock-dot" style={{ background: '#FF6058' }} />
                <span className="mock-dot" style={{ background: '#FFBD2E' }} />
                <span className="mock-dot" style={{ background: '#27C93F' }} />
              </div>
              <div className="h1" style={{ height: '30px' }} />
              <div className="mock-content" style={{ top: '108px' }}>
                <div className="row m" /><div className="row s" />
                <div className="card-row">
                  <div className="card-mock"><div className="strip" style={{ background: '#1A1A19', height: '8px' }} /><div className="strip" style={{ width: '60%' }} /></div>
                  <div className="card-mock"><div className="strip" style={{ background: '#FF5A82', height: '8px' }} /><div className="strip" style={{ width: '60%' }} /></div>
                  <div className="card-mock"><div className="strip" style={{ background: '#D97757', height: '8px' }} /><div className="strip" style={{ width: '60%' }} /></div>
                </div>
              </div>
            </div>

            <div className="callout" style={{ top: '96px', left: '10%', opacity: '.55' }}>1</div>
            <div className="callout" style={{ top: '160px', left: '20%', opacity: '.55' }}>2</div>
            <div className="callout" style={{ top: '230px', left: '30%', opacity: '.55' }}>3</div>

            {/* Active comment thread */}
            <div className="comment-thread" style={{ top: '200px', left: '64%', opacity: resolved ? 0.5 : 1, transition: 'opacity .2s' }}>
              <div className="row">
                <div className="av">S</div>
                <div className="body">
                  <div className="row-x spread"><div className="name">Sam Patel</div><span className="ts">12 min ago</span></div>
                  <div className="text">Can we try the pink CTA at <b>#FF5A82</b> for the second card too? The contrast feels muted on warm bg.</div>
                </div>
              </div>
              <div className="row" style={{ marginTop: '10px' }}>
                <div className="av" style={{ background: 'linear-gradient(135deg,#f4c8b3,#e29a85)' }}>M</div>
                <div className="body">
                  <div className="row-x spread"><div className="name">Miranda</div><span className="ts">8 min ago</span></div>
                  <div className="text">Good call — let me try it on the middle card and we can A/B from there.</div>
                </div>
              </div>
              {replies.map((r, i) => (
                <div key={i} className="row" style={{ marginTop: '10px' }}>
                  <div className="av" style={{ background: 'linear-gradient(135deg,#f4c8b3,#e29a85)' }}>M</div>
                  <div className="body">
                    <div className="row-x spread"><div className="name">Miranda</div><span className="ts">just now</span></div>
                    <div className="text">{r}</div>
                  </div>
                </div>
              ))}
              <div className="reply">
                <input placeholder="Reply or @mention…" value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendReply() }} />
                <button className="btn btn-primary" style={{ padding: '7px 12px' }} onClick={sendReply}>Send</button>
              </div>
              <div className="row-x spread" style={{ marginTop: '10px' }}>
                <div className="toggle">
                  <button className="active">Unresolved</button>
                  <button>Resolved</button>
                </div>
                <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => setResolved(true)}>Resolve →</button>
              </div>
            </div>
          </div>

          <div className="bottom-bar">
            <div className="inner">
              <div className="seg">
                <button className="active">⊞ Single</button>
                <button onClick={() => navigate('/file-view/side-by-side')}>⊟ Side-by-side</button>
              </div>
              <div style={{ width: '1px', height: '22px', background: 'var(--border)' }} />
              <button className="btn btn-ghost" style={{ background: 'var(--bg-2)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M21 12a8 8 0 1 1-3.5-6.6L21 4l-1 4"/></svg>
                Comment mode · ON
              </button>
              <button className="btn btn-secondary">Restore this version</button>
            </div>
          </div>
        </main>
      </div>
  )
}
