import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes (300,000 ms)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.currentUser())
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => { setBootstrapping(false) }, [])

  const logout = useCallback((reason) => {
    authService.logout()
    localStorage.removeItem('arerti_last_activity')
    setUser(null)

    if (reason === 'inactivity') {
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
  }, [])

  const login = useCallback(async (username, password) => {
    const data = await authService.login(username, password)
    localStorage.setItem('arerti_last_activity', Date.now().toString())
    setUser({ username: data.username, fullName: data.fullName, role: data.role })
    return data
  }, [])

  // ── 5-Minute Inactivity Auto-Logout Tracker ─────────────────────────────────
  useEffect(() => {
    if (!user) return

    // Initialize last activity timestamp if missing
    if (!localStorage.getItem('arerti_last_activity')) {
      localStorage.setItem('arerti_last_activity', Date.now().toString())
    }

    const recordActivity = () => {
      localStorage.setItem('arerti_last_activity', Date.now().toString())
    }

    const checkInactivity = () => {
      const lastActivity = parseInt(localStorage.getItem('arerti_last_activity') || '0', 10)
      if (lastActivity && Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
        logout('inactivity')
      }
    }

    // Capture user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    let throttleTimeout = null

    const handleUserInteraction = () => {
      if (!throttleTimeout) {
        recordActivity()
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null
        }, 2000)
      }
    }

    events.forEach(evt => window.addEventListener(evt, handleUserInteraction, { passive: true }))

    // Periodic check every 10 seconds
    const intervalId = setInterval(checkInactivity, 10000)

    // Check immediately when tab becomes visible (e.g. user returns to minimized browser)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserInteraction))
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (throttleTimeout) clearTimeout(throttleTimeout)
    }
  }, [user, logout])

  return (
    <AuthContext.Provider value={{ user, login, logout, bootstrapping, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
