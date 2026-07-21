import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RequireAuth({ children, requireOnboarded = true }) {
  const { isAuthenticated, isOnboarded } = useAuth()

  if (!isAuthenticated) return <Navigate to="/signup" replace />
  if (requireOnboarded && !isOnboarded) return <Navigate to="/onboarding/sync" replace />

  return children
}
