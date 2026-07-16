import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'

// Route-based code splitting: each page ships in its own chunk and loads on
// demand, so the initial bundle no longer includes every screen (and its deps
// like html2canvas) up front.
const Home                = lazy(() => import('./pages/Home'))
const Recents             = lazy(() => import('./pages/Recents'))
const Projects            = lazy(() => import('./pages/Projects'))
const Shared              = lazy(() => import('./pages/Shared'))
const ActionLibrary       = lazy(() => import('./pages/ActionLibrary'))
const ActionLibraryAdjust = lazy(() => import('./pages/ActionLibraryAdjust'))
const FileView            = lazy(() => import('./pages/FileView'))
const FileViewComment     = lazy(() => import('./pages/FileViewComment'))
const FileViewSideBySide  = lazy(() => import('./pages/FileViewSideBySide'))
const Settings            = lazy(() => import('./pages/Settings'))
const Notifications        = lazy(() => import('./pages/Notifications'))
const Companion           = lazy(() => import('./pages/Companion'))
const ActionChainApply    = lazy(() => import('./pages/ActionChainApply'))

function ToastContainer() {
  const [toasts, setToasts] = useState([])
  const timerRef = useRef({})

  const addToast = useCallback((msg) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, visible: true }])
    timerRef.current[id] = setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, visible: false } : t))
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300)
    }, 3000)
  }, [])

  // Expose globally so any component can call window.__toast('...')
  useEffect(() => {
    window.__toast = addToast
    return () => { window.__toast = null }
  }, [addToast])

  return (
    <div style={{ position: 'fixed', bottom: '22px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 9999, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: '#0a0a0a',
          color: 'white',
          borderRadius: '8px',
          padding: '9px 18px',
          fontSize: '13px',
          fontWeight: 500,
          fontFamily: "'Inter', sans-serif",
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,.25)',
          opacity: t.visible ? 1 : 0,
          transform: t.visible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity .25s ease, transform .25s ease',
        }}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          {/* Standalone pages — no sidebar Layout */}
          <Route path="/companion" element={<Companion />} />
          <Route path="/action-chain-apply/:chainId" element={<ActionChainApply />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="files" element={<Recents />} />
            <Route path="projects" element={<Projects />} />
            <Route path="shared" element={<Shared />} />
            <Route path="actions" element={<ActionLibrary />} />
            <Route path="actions/adjust" element={<ActionLibraryAdjust />} />
            <Route path="file-view" element={<FileView />} />
            <Route path="file-view/comment" element={<FileViewComment />} />
            <Route path="file-view/side-by-side" element={<FileViewSideBySide />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  )
}
