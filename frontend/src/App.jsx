import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Versions from './pages/Versions.jsx'
import Library from './pages/Library.jsx'
import ComponentDetail from './pages/ComponentDetail.jsx'
import DesignSystems from './pages/DesignSystems.jsx'
import DesignSystemDetail from './pages/DesignSystemDetail.jsx'
import AuthCallback from './pages/AuthCallback.jsx'
import SignUp from './pages/SignUp.jsx'
import AuthorizeGitHub from './pages/AuthorizeGitHub.jsx'

// Route map mirrors the team build-flow doc (docs/iterait-build-flow.md).
// Onboarding (signup + GitHub connect) gates the main app shell via
// RequireAuth; everything else lives inside Layout's sidebar.
export default function App() {
  return (
    <Routes>
      {/* OAuth callback lives outside the app shell */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/signup" element={<SignUp />} />
      <Route
        path="/onboarding/authorize-github"
        element={
          <RequireAuth requireOnboarded={false}>
            <AuthorizeGitHub />
          </RequireAuth>
        }
      />

      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects/:owner/:repo" element={<Versions />} />
        <Route path="library" element={<Library />} />
        <Route path="library/:componentId" element={<ComponentDetail />} />
        <Route path="design-systems" element={<DesignSystems />} />
        <Route path="design-systems/:id" element={<DesignSystemDetail />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
