import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CONNECTIONS = [
  { letter: 'F', name: 'Figma', detail: '12 files synced · last 2m ago', bg: '#F24E1E', connected: true },
  { letter: 'L', name: 'Loveable', detail: '7 files synced · last 5m ago', bg: '#FF5A82', connected: true },
  { letter: 'C', name: 'Cursor', detail: '4 files synced · last 1h ago', bg: '#111', connected: true },
  { letter: 'C', name: 'Claude', detail: '9 files synced · last 12m ago', bg: '#D97757', connected: true },
  { letter: 'R', name: 'Replit', detail: '3 files synced · last 4h ago', bg: '#F26207', connected: true },
  { letter: 'G', name: 'Glitch', detail: 'Not connected', bg: '#C72FBF', connected: false },
]

const NOTIF_ROWS = [
  { label: 'Comments on your files', desc: 'When a collaborator leaves a comment.', inApp: true, email: true },
  { label: 'Suggestions to review', desc: 'When someone proposes a change.', inApp: true, email: false },
  { label: 'New shares', desc: 'When a file is shared with you.', inApp: true, email: true },
  { label: 'Action conflicts', desc: 'When applying an action triggers a conflict.', inApp: true, email: false },
  { label: 'Weekly digest', desc: "A Monday-morning summary of your week's activity.", inApp: false, email: true },
]

const PLUGINS = [
  { name: 'Figma', version: 'v1.2 · MacOS / Win', bg: '#F24E1E', letter: 'F', action: 'Install' },
  { name: 'Loveable', version: 'v0.9 · Web', bg: '#FF5A82', letter: 'L', action: 'Install' },
  { name: 'Cursor', version: 'v0.7 · Beta', bg: '#111', letter: 'C', action: 'Join beta' },
  { name: 'Claude', version: 'v1.0 · Web', bg: '#D97757', letter: 'C', action: 'Install' },
  { name: 'Replit', version: 'v0.5 · Beta', bg: '#F26207', letter: 'R', action: 'Join beta' },
  { name: 'Glitch', version: 'Coming soon', bg: '#C72FBF', letter: 'G', action: 'Notify me' },
]

function Switch({ on, onChange }) {
  return (
    <span className={`switch${on ? ' on' : ''}`} style={{ cursor: 'pointer' }} onClick={onChange} />
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState(NOTIF_ROWS.map(r => ({ inApp: r.inApp, email: r.email })))

  const toggleNotif = (i, channel) => {
    setNotifs(prev => prev.map((n, idx) => idx === i ? { ...n, [channel]: !n[channel] } : n))
  }

  return (
    <main className="main-v2" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <header className="topbar-v2">
        <div className="left">Settings</div>
        <div className="search-v2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input placeholder="Search..." />
        </div>
        <div className="right">
          <img src="/src/assets/avatar-profile.jpg" alt="Profile" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', display: 'block', cursor: 'pointer', border: '2px solid #f0f0f0' }} />
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', flex: 1, overflow: 'hidden' }}>
        <aside style={{ overflowY: 'auto', padding: '20px 14px 40px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <p style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--text-3)', padding: '0 8px 14px', margin: 0 }}>Manage your account, connections, notifications, and plugins.</p>
          {['Account', 'Platform connections', 'Notifications', 'Plugin downloads', 'Billing'].map(label => (
            <a key={label} className="nav-item" href={`#${label.toLowerCase().split(' ')[0]}`} style={{ fontSize: '13px', padding: '6px 10px' }}>{label}</a>
          ))}
        </aside>

        <div style={{ overflowY: 'auto', padding: '24px 32px 60px' }}>
          {/* Account */}
          <section className="settings-card" id="account">
            <h3>Account</h3>
            <p className="desc">Your profile is shared across LayerSync and connected platforms.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px', alignItems: 'center' }}>
              <div className="avatar" style={{ width: '64px', height: '64px', fontSize: '22px', background: 'linear-gradient(135deg,#f4c8b3,#e29a85)' }}>M</div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600 }}>Miranda</div>
                <div className="muted small">michellebui45@gmail.com · Free plan</div>
                <div className="row-x" style={{ gap: '8px', marginTop: '10px' }}>
                  <button className="btn btn-secondary">Change avatar</button>
                  <button className="btn btn-ghost">Sign out</button>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '18px' }}>
              {[['Display name', 'Miranda'], ['Email', 'michellebui45@gmail.com'], ['Workspace', "Miranda's workspace"], ['Time zone', 'America / Los Angeles']].map(([label, val]) => (
                <div key={label}>
                  <label className="muted tiny" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</label>
                  <input className="input" defaultValue={val} style={{ marginTop: '6px' }} />
                </div>
              ))}
            </div>
            <div className="page-actions"><button className="btn btn-primary">Save changes</button></div>
          </section>

          {/* Connections */}
          <section className="settings-card" id="connections">
            <h3>Platform connections</h3>
            <p className="desc">Link your design and vibe-coding tools. LayerSync watches files and tracks every save.</p>
            {CONNECTIONS.map(c => (
              <div key={c.name} className="connection-row">
                <div className="platform-square" style={{ background: c.bg }}>{c.letter}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{c.name}</div>
                  <div className="muted small">{c.detail}</div>
                </div>
                <div className="row-x" style={{ gap: '8px' }}>
                  <span className={`badge ${c.connected ? 'current' : 'archived'}`}>{c.connected ? 'Connected' : 'Disconnected'}</span>
                  <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}>{c.connected ? 'Disconnect' : 'Connect'}</button>
                </div>
              </div>
            ))}
          </section>

          {/* Notifications */}
          <section className="settings-card" id="notifications">
            <h3>Notifications</h3>
            <p className="desc">Choose what shows up in your slide-in panel and what reaches your inbox.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {NOTIF_ROWS.map((row, i) => (
                <div key={row.label} className="row-x spread" style={i > 0 ? { borderTop: '1px solid var(--border)', paddingTop: '14px' } : {}}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{row.label}</div>
                    <div className="muted small" style={{ marginTop: '2px' }}>{row.desc}</div>
                  </div>
                  <div className="row-x" style={{ gap: '18px' }}>
                    <div className="row-x" style={{ gap: '6px' }}>
                      <Switch on={notifs[i].inApp} onChange={() => toggleNotif(i, 'inApp')} />
                      <span className="muted tiny">In-app</span>
                    </div>
                    <div className="row-x" style={{ gap: '6px' }}>
                      <Switch on={notifs[i].email} onChange={() => toggleNotif(i, 'email')} />
                      <span className="muted tiny">Email</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Plugins */}
          <section className="settings-card" id="plugins">
            <h3>Plugin downloads</h3>
            <p className="desc">Install LayerSync inside the tools you already use.</p>
            <div className="folder-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
              {PLUGINS.map(p => (
                <div key={p.name} className="folder lavender">
                  <div className="tab" />
                  <div><div className="name">{p.name}</div><div className="count">{p.version}</div></div>
                  <div className="footer">
                    <span className="brand-dot" style={{ background: p.bg }}>{p.letter}</span>
                    <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }}>{p.action}</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Billing */}
          <section className="settings-card" id="billing">
            <h3>Billing</h3>
            <p className="desc">You're on the Free plan. Upgrade for unlimited action chains and team collaborators.</p>
            <div className="row-x spread" style={{ marginTop: '8px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Free plan</div>
                <div className="muted small" style={{ marginTop: '2px' }}>3 platforms · 5 action chains · solo</div>
              </div>
              <button className="btn btn-primary">Upgrade to Pro</button>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
