import { useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import colorLogo from '../assets/Color-Logo.png'
import WatcherStatus from './WatcherStatus'

const PREFS_KEY = 'iterait_watcher_prefs'

function openCompanion() {
  window.open(
    '/companion',
    'iterait-companion',
    'width=420,height=780,left=20,top=60,resizable=yes,scrollbars=yes'
  )
}

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const location = useLocation()
  const tipRef = useRef(null)
  const hasPrefs = !!localStorage.getItem(PREFS_KEY)
  const watcherStatus = hasPrefs ? 'watching' : 'no-file'

  const isActive = (path) => location.pathname.startsWith(path)

  const showTip = (e) => {
    if (!collapsed || !tipRef.current) return
    const row = e.target.closest('[data-tip]')
    if (!row) return
    const rect = row.getBoundingClientRect()
    tipRef.current.textContent = row.dataset.tip
    tipRef.current.style.left = (rect.right + 8) + 'px'
    tipRef.current.style.top = (rect.top + rect.height / 2) + 'px'
    tipRef.current.classList.add('visible')
  }
  const hideTip = () => tipRef.current?.classList.remove('visible')
  const maybeHideTip = (e) => {
    if (!e.relatedTarget || !e.relatedTarget.closest?.('.nav-row, .footer-row')) hideTip()
  }

  const iconCollapse = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
  const iconExpand = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  )

  return (
    <>
      <aside
        className={`sidebar-v2${collapsed ? ' collapsed' : ''}`}
        style={{ overflow: 'hidden', gap: '6px', position: 'relative' }}
        onMouseOver={showTip}
        onMouseLeave={hideTip}
        onMouseOut={maybeHideTip}
      >
        <div className="brand-v2" style={{ paddingBottom: '14px' }}>
          <img src={colorLogo} alt="iterait" style={{ height: 28, display: 'block' }} />
        </div>

        {/* Main nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div className={`nav-row${isActive('/dashboard') ? ' active-pg' : ''}`} data-tip="Home" onClick={() => navigate('/dashboard')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </div>
          <div className={`nav-row${isActive('/actions') ? ' active-pg' : ''}`} data-tip="Action Library" onClick={() => navigate('/actions')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            Action Library
          </div>
        </div>

        {/* Footer area — companion + settings grouped at bottom */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div className="footer-row" data-tip="Companion" onClick={openCompanion}
            style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <WatcherStatus status={watcherStatus} variant="dot" />
            {!collapsed && <span>Companion</span>}
          </div>

          <div className={`footer-row${isActive('/settings') ? ' active-pg' : ''}`} style={{ marginTop: 0 }} data-tip="Settings" onClick={() => navigate('/settings')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            Settings
          </div>
        </div>{/* end footer wrapper */}

        {/* Collapse toggle button */}
        <button className="sidebar-toggle-btn" title="Toggle sidebar" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
          {collapsed ? iconExpand : iconCollapse}
        </button>
      </aside>

      {/* Fixed tooltip for collapsed state */}
      <div ref={tipRef} className="sidebar-tip" />
    </>
  )
}
