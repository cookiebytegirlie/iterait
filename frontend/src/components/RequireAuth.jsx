import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

// Route guard: no session → /signup. Signed up but hasn't connected GitHub
// yet → /onboarding/authorize-github. Pass requireOnboarded={false} for the
// onboarding routes themselves, which only need a session to exist.
export default function RequireAuth({ children, requireOnboarded = true }) {
  const { isAuthenticated, isOnboarded } = useAuth()

  if (!isAuthenticated) return <Navigate to="/signup" replace />
  if (requireOnboarded && !isOnboarded) return <Navigate to="/onboarding/authorize-github" replace />

  return children
}
