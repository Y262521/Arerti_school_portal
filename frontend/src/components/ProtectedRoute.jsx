import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wrap any route that requires login.
 * Optionally restrict by role:
 *   <ProtectedRoute roles={['ADMIN','TEACHER']} />
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, isLoggedIn } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/forbidden" replace />
  }

  return children
}
