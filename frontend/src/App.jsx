import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Timeline from './pages/Timeline.jsx'
import Actions from './pages/Actions.jsx'
import Apply from './pages/Apply.jsx'
import AuthCallback from './pages/AuthCallback.jsx'

// Route map mirrors the team build-flow doc (docs/iterait-build-flow.md).
// Each page is a stub — a clear, wired entry point for the frontend team to
// build out. The nav shell, routing, theme, and API client are already here.
export default function App() {
  return (
    <Routes>
      {/* OAuth callback lives outside the app shell */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="timeline/:owner/:repo" element={<Timeline />} />
        <Route path="actions" element={<Actions />} />
        <Route path="apply" element={<Apply />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
