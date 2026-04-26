import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const NOTIFS = [
  { section: 'Today', items: [
    { av: 'S', avBg: null, text: <><b>Sam Patel</b> left a comment on <b>Umi onboarding</b></>, quote: '"Can we try the pink CTA at #FF5A82 for the second card too?"', badge: 'Comment', badgeStyle: {}, time: '12 min ago', unread: true, tags: 'comment', href: '/file-view/comment' },
    { av: 'J', avBg: 'linear-gradient(135deg,#a8dcbf,#5da77f)', text: <><b>Jordan Lee</b> suggested a change on <b>Truus contact</b></>, quote: '"Hero gradient looks great. Suggesting subtitle line-height 1.5."', badge: 'Suggestion', badgeStyle: { background: '#EDE9FE', color: '#5B21B6' }, time: '1h ago', unread: true, tags: 'suggestion', href: '/file-view' },
    { av: 'A', avBg: 'linear-gradient(135deg,#f5c2a0,#d6845a)', text: <><b>Aisha Rahman</b> shared <b>Wanderly map</b> with you</>, badge: 'Share', badgeStyle: { background: '#DCFCE7', color: '#15803D' }, time: '2h ago', unread: true, tags: 'share', href: '/file-view', primary: true },
  ]},
  { section: 'Earlier this week', items: [
    { av: 'S', avBg: null, text: <><b>Sam Patel</b> resolved 2 comments on <b>Pricing page</b></>, badge: 'Comment', badgeStyle: {}, time: 'Yesterday', unread: false, tags: 'comment' },
    { av: 'M', avBg: 'linear-gradient(135deg,#c7bcfb,#8e7df0)', text: <><b>You</b> applied <b>Notion-warm dashboard polish</b></>, quote: '5 changes applied · 2 conflicts resolved', badge: 'Action', badgeStyle: { background: '#FEF3C7', color: '#B45309' }, time: '2 days ago', unread: false, tags: 'action' },
    { av: 'J', avBg: 'linear-gradient(135deg,#a8dcbf,#5da77f)', text: <><b>Jordan Lee</b> commented on <b>Mobile wireframes</b></>, quote: '"Top nav padding feels tight on small screens."', badge: 'Comment', badgeStyle: {}, time: '3 days ago', unread: false, tags: 'comment' },
  ]},
]

export default function Notifications() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [unreadIds, setUnreadIds] = useState(new Set([0, 1, 2]))

  const markAllRead = () => setUnreadIds(new Set())

  const filters = ['all', 'comment', 'suggestion', 'share', 'action']

  return (
    <main className="main-v2">
      <header className="topbar-v2">
        <div className="left">Notifications</div>
        <div className="search-v2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input placeholder="Search..." />
        </div>
        <div className="right"><img src="/src/assets/avatar-profile.jpg" alt="Profile" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', display: 'block', cursor: 'pointer', border: '2px solid #f0f0f0' }} /></div>
      </header>

      <div style={{ padding: '8px 32px 60px', maxWidth: '780px' }}>
        <div className="row-x spread" style={{ marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '30px' }}>Notifications</h1>
            <p className="muted small" style={{ marginTop: '6px' }}>{unreadIds.size} unread · last 7 days</p>
          </div>
          <button className="btn btn-secondary" onClick={markAllRead}>Mark all read</button>
        </div>

        <div className="filters">
          {filters.map(f => (
            <span key={f} className={`pill${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </span>
          ))}
        </div>

        <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {NOTIFS.map((group, gi) => {
            const filtered = group.items.filter(item => filter === 'all' || item.tags === filter)
            if (!filtered.length) return null
            return (
              <div key={group.section}>
                <div className="muted tiny" style={{ textTransform: 'uppercase', letterSpacing: '.08em', paddingTop: '6px', marginBottom: '8px' }}>{group.section}</div>
                {filtered.map((item, i) => {
                  const globalIdx = gi * 10 + i
                  const isUnread = unreadIds.has(globalIdx)
                  return (
                    <div key={i} className={`notif-item${isUnread ? ' unread' : ''}`}>
                      <div className="av" style={item.avBg ? { background: item.avBg } : {}}>{item.av}</div>
                      <div>
                        <div className="text">{item.text}</div>
                        {item.quote && <div className="muted small" style={{ marginTop: '6px' }}>{item.quote}</div>}
                        <div className="meta">
                          <span className="type-badge" style={item.badgeStyle}>{item.badge}</span> · {item.time}
                        </div>
                        {isUnread && (
                          <div className="actions">
                            {item.href && (
                              <button className={`btn ${item.primary ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => navigate(item.href)}>
                                {item.primary ? 'Open file' : item.tags === 'suggestion' ? 'Review' : 'Go to file'}
                              </button>
                            )}
                            <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => setUnreadIds(s => { const n = new Set(s); n.delete(globalIdx); return n })}>Mark read</button>
                            {item.primary && <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: '12px' }}>Decline</button>}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
