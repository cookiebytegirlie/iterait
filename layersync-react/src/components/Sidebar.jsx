import { useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import logo from '/iterait-logo.svg'
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

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith('/' + path)

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
          <img src={logo} className="brand-logo-icon" alt="iterait" /> iterait
        </div>

        {/* Pinned */}
        <div className="pinned-group" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div className="nav-row" data-tip="Pinned">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16">
              <path d="M12 2l1.5 4.5h4.5l-3.6 2.7 1.4 4.3-3.8-2.8-3.8 2.8 1.4-4.3L5.5 6.5H10z"/>
              <line x1="12" y1="13" x2="12" y2="22"/>
            </svg>
            Pinned
          </div>
          <div className="pin-sub-list">
            <div className="pin-sub" onClick={() => navigate('/file-view')}>Marketing Landing Page</div>
            <div className="pin-sub" onClick={() => navigate('/file-view')}>Checkout Flow v3</div>
            <div className="pin-sub" onClick={() => navigate('/file-view')}>Dashboard Redesign</div>
          </div>
        </div>

        <div className="pinned-spacer" style={{ height: '8px' }} />

        {/* Main nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div className={`nav-row${isActive('/') && location.pathname === '/' ? ' active-pg' : ''}`} data-tip="Home" onClick={() => navigate('/')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Home
          </div>
          <div className={`nav-row${isActive('files') ? ' active-pg' : ''}`} data-tip="Files" onClick={() => navigate('/files')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            Files
          </div>
          <div className={`nav-row${isActive('projects') ? ' active-pg' : ''}`} data-tip="Projects" onClick={() => navigate('/projects')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>
            Projects
          </div>
          <div className={`nav-row${isActive('shared') ? ' active-pg' : ''}`} data-tip="Shared" onClick={() => navigate('/shared')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="9" cy="7" r="4"/>
              <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
              <path d="M16 3.13a4 4 0 010 7.75"/>
              <path d="M21 21v-2a4 4 0 00-3-3.87"/>
            </svg>
            Shared
          </div>
          <div className={`nav-row${isActive('actions') ? ' active-pg' : ''}`} data-tip="Action Library" onClick={() => navigate('/actions')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            Action Library
          </div>
          <div className="nav-row" data-tip="Trash">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
            Trash
          </div>
        </div>

        {/* Footer area — companion + settings grouped at bottom */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div className="footer-row" data-tip="Companion" onClick={openCompanion}
            style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <WatcherStatus status={watcherStatus} variant="dot" />
            {!collapsed && <span>Companion</span>}
          </div>

          <div className={`footer-row${isActive('settings') ? ' active-pg' : ''}`} style={{ marginTop: 0 }} data-tip="Settings" onClick={() => navigate('/settings')}>
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
